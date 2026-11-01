import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function envKey(mapName: string, fallbackName: string) {
  const direct = Deno.env.get(fallbackName);
  if (direct) return direct;
  try {
    const keys = JSON.parse(Deno.env.get(mapName) ?? "{}");
    return keys.default ?? Object.values(keys)[0] as string | undefined;
  } catch {
    return undefined;
  }
}

export function backendConfig() {
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const serviceKey = envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !serviceKey) return null;

  return {
    url,
    publishableKey,
    service: createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    auth: createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export async function codeDigest(userId: string, code: string, pepper: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${userId}:${code}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateLoginCode() {
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return String(100000 + random[0] % 900000);
}

export function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function sendLoginCode(email: string, code: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) throw new Error("Email delivery is not configured. Add the Resend API key and verified sender address to Supabase Function Secrets.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your StayFit Gym sign-in code",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#142536"><h2>Sign in to StayFit Gym</h2><p>Enter this code in the app to finish signing in:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes and can only be used once. If you did not try to sign in, you can ignore this email.</p></div>`,
      text: `Your StayFit Gym sign-in code is ${code}. It expires in 10 minutes and can only be used once. If you did not try to sign in, ignore this email.`,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof result.message === "string" ? result.message : "Email provider rejected the sign-in code email.";
    throw new Error(message);
  }
}

export function requestBody(req: Request) {
  return req.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export function credentials(body: Record<string, unknown> | null) {
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length > 1024) return null;
  return { email, password };
}
