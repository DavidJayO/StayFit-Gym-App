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
    if (authError || !authData.user) return json({ error: "Please sign in with an administrator account." }, 401);
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: profile, error: profileError } = await admin.from("profiles").select("role").eq("id", authData.user.id).single();
    if (profileError || profile?.role !== "admin") return json({ error: "Administrator access required." }, 403);

    const body = await req.json();
    const requestId = String(body.request_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return json({ error: "Invalid daily pass request." }, 400);
    const { data: request, error: requestError } = await admin.from("daily_pass_requests")
      .select("id,amount,status,payment_method,payment_status,paypal_invoice_id")
      .eq("id", requestId).single();
    if (requestError || !request) return json({ error: "Daily pass request not found." }, 404);
    if (request.status !== "pending" || request.payment_method !== "PayPal") return json({ error: "This request is not awaiting PayPal verification." }, 409);
    if (request.payment_status !== "submitted" || !request.paypal_invoice_id) return json({ error: "The member has not created a PayPal invoice yet." }, 409);

    const token = await paypalToken(paypalClientId, paypalSecret);
    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/invoicing/invoices/${encodeURIComponent(request.paypal_invoice_id)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const invoice = await response.json();
    if (!response.ok) throw new Error(invoice.message ?? "Unable to check the PayPal invoice.");
    if (invoice.detail?.reference !== request.id || invoice.detail?.currency_code !== "PHP") {
      return json({ error: "PayPal invoice details do not match this daily pass request." }, 409);
    }
    const invoiceLine = (invoice.items ?? []).find((item: { name?: string }) => item.name === "Daily Pass");
    if (!invoiceLine || Number(invoiceLine.quantity) !== 1 || invoiceLine.unit_amount?.currency_code !== "PHP" || Number(invoiceLine.unit_amount?.value) !== Number(request.amount)) {
      return json({ error: "The PayPal invoice amount does not match the daily pass." }, 409);
    }
    if (invoice.status !== "PAID") return json({ paid: false, paypal_status: invoice.status ?? "UNKNOWN" });

    const { error: confirmError } = await userClient.rpc("admin_confirm_daily_pass_paypal", {
      p_request_id: request.id,
      p_invoice_id: request.paypal_invoice_id,
    });
    if (confirmError) throw confirmError;
    return json({ paid: true, paypal_status: invoice.status, approved: true });
  } catch (error) {
    console.error("verify-paypal-daily-pass-payment:", error);
    return json({ error: error instanceof Error ? error.message : "Could not verify the PayPal payment." }, 400);
  }
});
