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

async function paypalRequest(token: string, path: string, method: string, body?: unknown) {
  const response = await fetch(`https://api-m.sandbox.paypal.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? data.name ?? "PayPal request failed.");
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
      return json({ error: "Payment backend is not configured. Set PayPal sandbox credentials in Supabase Edge Function secrets." }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Please sign in again." }, 401);
    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return json({ error: "Invalid plan request." }, 400);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: request, error: requestError } = await admin.from("membership_plan_requests")
      .select("id,user_id,plan_name,amount,billing_period,status,payment_status,paypal_invoice_id,paypal_invoice_url")
      .eq("id", requestId).eq("user_id", authData.user.id).single();
    if (requestError || !request) return json({ error: "Plan request not found for this account." }, 404);
    if (request.status !== "pending") return json({ error: "This plan request is no longer pending." }, 409);
    if (request.payment_status === "verified") return json({ error: "This plan request has already been completed." }, 409);

    const token = await paypalToken(paypalClientId, paypalSecret);
    let invoiceId = request.paypal_invoice_id as string | null;
    let invoiceUrl = request.paypal_invoice_url as string | null;
    let invoiceStatus = "UNPAID";
    if (invoiceId) {
      const invoice = await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`, "GET");
      if (invoice.detail?.reference !== request.id || invoice.detail?.currency_code !== "PHP") throw new Error("Saved PayPal invoice does not match this membership request.");
      if (invoice.status === "CANCELLED" || invoice.status === "REFUNDED") throw new Error(`PayPal invoice is ${String(invoice.status).toLowerCase()}. Contact gym staff.`);
      invoiceStatus = invoice.status ?? "UNKNOWN";
    } else {
      const email = authData.user.email;
      if (!email) return json({ error: "Your account needs an email address for PayPal checkout." }, 400);
      const invoice = await paypalRequest(token, "/v2/invoicing/invoices", "POST", {
        detail: {
          invoice_number: `SF-${request.id.replaceAll("-", "").slice(0, 22)}`,
          reference: request.id,
          currency_code: "PHP",
          payment_term: { term_type: "DUE_ON_RECEIPT" },
          memo: `StayFit Gym membership request ${request.id}`,
        },
        invoicer: { business_name: "StayFit Gym" },
        primary_recipients: [{ billing_info: { email_address: email } }],
        items: [{ name: request.plan_name, description: `${request.billing_period} StayFit Gym membership`, quantity: "1", unit_of_measure: "QUANTITY", unit_amount: { currency_code: "PHP", value: Number(request.amount).toFixed(2) } }],
      });
      invoiceId = invoice.id;
      await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId!)}/send`, "POST", { send_to_recipient: false, send_to_invoicer: false });
      invoiceUrl = invoice.links?.find((link: { rel: string }) => link.rel === "payer-view")?.href ?? null;
      if (!invoiceUrl) {
        const sentInvoice = await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId!)}`, "GET");
        invoiceUrl = sentInvoice.links?.find((link: { rel: string }) => link.rel === "payer-view")?.href ?? null;
      }
      const { error: updateError } = await admin.from("membership_plan_requests").update({
        payment_method: "PayPal", payment_reference: invoiceId, payment_status: "submitted",
        payment_submitted_at: new Date().toISOString(), paypal_invoice_id: invoiceId, paypal_invoice_url: invoiceUrl,
      }).eq("id", request.id).eq("user_id", authData.user.id).eq("status", "pending");
      if (updateError) throw updateError;
    }

    const { error: paymentError } = await admin.from("payments").upsert({
      user_id: authData.user.id, description: `${request.plan_name} membership`, amount: request.amount,
      payment_method: "PayPal", status: "pending", membership_plan_request_id: request.id,
    }, { onConflict: "membership_plan_request_id" });
    if (paymentError) throw paymentError;

    const qrResponse = await paypalRequest(token, `/v2/invoicing/invoices/${encodeURIComponent(invoiceId!)}/generate-qr-code`, "POST", { width: 400, height: 400 });
    if (!qrResponse.image) throw new Error("PayPal did not return a payment QR code.");
    return json({ invoice_id: invoiceId, invoice_url: invoiceUrl, invoice_status: invoiceStatus, qr_base64: qrResponse.image });
  } catch (error) {
    console.error("create-plan-paypal-invoice:", error);
    return json({ error: error instanceof Error ? error.message : "Could not start PayPal checkout." }, 400);
  }
});
