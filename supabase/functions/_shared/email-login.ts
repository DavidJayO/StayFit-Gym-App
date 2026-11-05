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

export function requestBody(req: Request) {
  return req.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export function credentials(body: Record<string, unknown> | null) {
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length > 1024) return null;
  return { email, password };
}
