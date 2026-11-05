import {
  backendConfig,
  corsHeaders,
  credentials,
  json,
  requestBody,
} from "../_shared/email-login.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const config = backendConfig();
  if (!config) return json({ error: "Login verification is not configured on the server." }, 503);

  const body = await requestBody(req);
  const login = credentials(body);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!login || !/^\d{8}$/.test(code)) return json({ error: "Enter your email, password, and the eight-digit code." }, 400);

  try {
    const { data, error } = await config.auth.auth.signInWithPassword(login);
    if (error || !data.user?.id || !data.user.email || !data.session) {
      if (error?.code === "email_not_confirmed") {
        return json({ error: "Confirm your email address from the registration email before signing in." }, 403);
      }
      return json({ error: "Email or password is incorrect." }, 401);
    }

    const { data: profile, error: profileError } = await config.service
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError || !profile) return json({ error: "Your StayFit profile could not be loaded." }, 403);
    if (profile.role !== "member") return json({ error: "Admin accounts use password-only sign-in. Choose Admin." }, 403);

    const { data: verified, error: otpError } = await config.auth.auth.verifyOtp({
      email: data.user.email,
      token: code,
      type: "email",
    });
    if (otpError || !verified.session) {
      return json({ error: otpError?.message ?? "That code is invalid or expired. Request a new code and try again." }, 400);
    }

    return json({
      access_token: verified.session.access_token,
      refresh_token: verified.session.refresh_token,
    });
  } catch (error) {
    console.error("verify-login-email-code failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not verify the code. Please try again." }, 500);
  }
});
