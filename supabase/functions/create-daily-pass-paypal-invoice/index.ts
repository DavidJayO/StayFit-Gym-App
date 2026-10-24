import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function envKey(mapName: string, fallbackName: string) {
  const direct = Deno.env.get(fallbackName);
  if (direct) return direct;
  try {
    const keys = JSON.parse(Deno.env.get(mapName) ?? "{}");
    return keys.default ?? Object.values(keys)[0] as string | undefined;
  } catch { return undefined; }
}

async function paypalToken(clientId: string, secret: string) {
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description ?? "PayPal authentication failed.");
  return data.access_token as string;
}

async function paypalRequest(token: string, path: string, method: string, body?: unknown, returnRepresentation = false) {
  const response = await fetch(`https://api-m.sandbox.paypal.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", ...(returnRepresentation ? { Prefer: "return=representation" } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) {
    const issues = Array.isArray(data.details)
      ? data.details.map((item: { issue?: string; description?: string }) => [item.issue, item.description].filter(Boolean).join(": ")).filter(Boolean).join("; ")
      : "";
    const debugId = typeof data.debug_id === "string" ? ` PayPal debug ID: ${data.debug_id}.` : "";
    throw new Error(`${data.message ?? data.name ?? "PayPal request failed."}${issues ? ` Details: ${issues}.` : ""}${debugId} (endpoint: ${method} ${path})`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
    const serviceKey = envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    if (!authorization || !supabaseUrl || !anonKey || !serviceKey || !paypalClientId || !paypalSecret) {
      return json({ error: "Payment backend is not configured. Add PayPal sandbox credentials to Supabase Edge Function secrets." }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Please sign in again." }, 401);
    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return json({ error: "Invalid daily pass request." }, 400);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: request, error: requestError } = await admin.from("daily_pass_requests")
      .select("id,user_id,visit_on,amount,status,payment_method,payment_status,paypal_invoice_id,paypal_invoice_url")
      .eq("id", requestId).eq("user_id", authData.user.id).single();
    if (requestError || !request) return json({ error: "Daily pass request not found for this account." }, 404);
    if (request.status !== "pending" || request.payment_method !== "PayPal") return json({ error: "This request is not awaiting PayPal checkout." }, 409);
    if (request.payment_status === "paid") return json({ error: "This daily pass has already been paid." }, 409);
    const email = authData.user.email;
    if (!email) return json({ error: "Your account needs an email address for PayPal checkout." }, 400);

    const token = await paypalToken(paypalClientId, paypalSecret);
    let invoiceId = request.paypal_invoice_id as string | null;
    let invoiceUrl = request.paypal_invoice_url as string | null;
    let invoice: any;
    if (invoiceId) {
      invoice = await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, "GET");
      if (invoice.detail?.reference !== request.id || invoice.detail?.currency_code !== "PHP") throw new Error("Saved PayPal invoice does not match this daily pass request.");
      if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") throw new Error(`PayPal invoice is ${String(invoice.status).toLowerCase()}. Contact gym staff.`);
      if (invoice.status === "DRAFT") {
        await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/send`, "POST", { send_to_recipient: false, send_to_invoicer: false });
        invoice = await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, "GET");
      }
      invoiceUrl = invoiceUrl ?? invoice.links?.find((link: { rel: string }) => link.rel === "payer-view")?.href ?? invoice.metadata?.recipient_view_url ?? invoice.detail?.metadata?.recipient_view_url ?? null;
    } else {
      invoice = await paypalRequest(token, "/v2/invoicing/invoices", "POST", {
        detail: {
          reference: request.id,
          currency_code: "PHP",
          payment_term: { term_type: "DUE_ON_RECEIPT" },
          memo: `StayFit Gym daily pass ${request.id} · visit ${request.visit_on}`,
        },
        invoicer: { business_name: "StayFit Gym" },
        primary_recipients: [{ billing_info: { email_address: email } }],
        items: [{ name: "Daily Pass", description: `StayFit Gym day pass · visit ${request.visit_on}`, quantity: "1", unit_of_measure: "QUANTITY", unit_amount: { currency_code: "PHP", value: Number(request.amount).toFixed(2) } }],
      }, true);
      invoiceId = typeof invoice.id === "string" ? invoice.id : undefined;
      if (!invoiceId) {
        const selfLink = invoice.links?.find((link: { rel: string; href: string }) => link.rel === "self")?.href;
        invoiceId = typeof selfLink === "string" ? selfLink.match(/\/invoices\/([^/?]+)/)?.[1] : undefined;
      }
      if (!invoiceId) throw new Error("PayPal created the invoice but returned no invoice ID. Check the PayPal invoice list before trying again.");
      const { error: saveError } = await admin.from("daily_pass_requests").update({ payment_status: "submitted", paypal_invoice_id: invoiceId }).eq("id", request.id).eq("user_id", authData.user.id).eq("status", "pending");
      if (saveError) throw saveError;
      await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId!)}/send`, "POST", { send_to_recipient: false, send_to_invoicer: false });
      invoiceUrl = invoice.links?.find((link: { rel: string }) => link.rel === "payer-view")?.href ?? null;
      if (!invoiceUrl) {
        const sentInvoice = await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId!)}`, "GET");
        invoiceUrl = sentInvoice.links?.find((link: { rel: string }) => link.rel === "payer-view")?.href ?? sentInvoice.metadata?.recipient_view_url ?? sentInvoice.detail?.metadata?.recipient_view_url ?? null;
      }
      const { error: updateError } = await admin.from("daily_pass_requests").update({ paypal_invoice_url: invoiceUrl }).eq("id", request.id).eq("user_id", authData.user.id).eq("status", "pending");
      if (updateError) throw updateError;
    }

    return json({ invoice_id: invoiceId, invoice_url: invoiceUrl, invoice_status: invoice?.status ?? "UNKNOWN" });
  } catch (error) {
    console.error("create-daily-pass-paypal-invoice:", error);
    return json({ error: error instanceof Error ? error.message : "Could not start PayPal checkout." }, 400);
  }
});
