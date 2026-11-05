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

  const login = credentials(await requestBody(req));
  if (!login) return json({ error: "Enter a valid email address and password." }, 400);

  try {
    const { data, error } = await config.auth.auth.signInWithPassword(login);
    if (error || !data.user?.id || !data.user.email) {
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

    const { error: otpError } = await config.auth.auth.signInWithOtp({
      email: data.user.email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      console.error("request-login-email-code: Supabase Auth could not send OTP", otpError.message);
      return json({ error: otpError.message || "Could not send the verification email. Check Supabase SMTP settings and try again." }, 502);
    }

    return json({ sent: true });
  } catch (error) {
    console.error("request-login-email-code failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not start sign-in. Please try again." }, 500);
  }
});
