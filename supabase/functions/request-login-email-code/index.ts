import {
  backendConfig,
  codeDigest,
  corsHeaders,
  credentials,
  generateLoginCode,
  json,
  requestBody,
  sendLoginCode,
} from "../_shared/email-login.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const config = backendConfig();
  const pepper = Deno.env.get("LOGIN_OTP_PEPPER");
  if (!config || !pepper) return json({ error: "Login verification is not configured on the server." }, 503);

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

    const now = Date.now();
    const { error: cleanupError } = await config.service
      .from("login_email_challenges")
      .delete()
      .lt("expires_at", new Date(now).toISOString());
    if (cleanupError) {
      console.error("request-login-email-code: could not clean expired challenges", cleanupError.message);
      return json({ error: "Login verification storage is unavailable. Apply the email login codes migration first." }, 503);
    }

    const { data: previous, error: previousError } = await config.service
      .from("login_email_challenges")
      .select("sent_at")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (previousError) {
      console.error("request-login-email-code: could not read challenge table", previousError.message);
      return json({ error: "Login verification storage is unavailable. Apply the email login codes migration first." }, 503);
    }

    if (previous?.sent_at && now - Date.parse(previous.sent_at) < 60_000) {
      return json({ error: "Please wait a minute before requesting another code." }, 429);
    }

    const code = generateLoginCode();
    const hash = await codeDigest(data.user.id, code, pepper);
    const { error: saveError } = await config.service.from("login_email_challenges").upsert({
      user_id: data.user.id,
      email: data.user.email.trim().toLowerCase(),
      code_hash: hash,
      expires_at: new Date(now + 10 * 60_000).toISOString(),
      attempts: 0,
      sent_at: new Date(now).toISOString(),
    }, { onConflict: "user_id" });
    if (saveError) {
      console.error("request-login-email-code: could not save challenge", saveError.message);
      return json({ error: "Could not prepare the verification code. Please try again." }, 503);
    }

    try {
      await sendLoginCode(data.user.email, code);
    } catch (error) {
      await config.service.from("login_email_challenges").delete().eq("user_id", data.user.id).eq("code_hash", hash);
      console.error("request-login-email-code: email delivery failed", error instanceof Error ? error.message : "Unknown email provider error");
      return json({ error: "Could not send the verification email. Check the email provider settings and try again." }, 502);
    }

    return json({ sent: true, expires_in: 600 });
  } catch (error) {
    console.error("request-login-email-code failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not start sign-in. Please try again." }, 500);
  }
});
