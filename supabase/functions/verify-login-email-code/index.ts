import {
  backendConfig,
  codeDigest,
  corsHeaders,
  credentials,
  json,
  requestBody,
  safeEqual,
} from "../_shared/email-login.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const config = backendConfig();
  const pepper = Deno.env.get("LOGIN_OTP_PEPPER");
  if (!config || !pepper) return json({ error: "Login verification is not configured on the server." }, 503);

  const body = await requestBody(req);
  const login = credentials(body);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!login || !/^\d{6}$/.test(code)) return json({ error: "Enter your email, password, and the six-digit code." }, 400);

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

    const { data: challenge, error: challengeError } = await config.service
      .from("login_email_challenges")
      .select("user_id,email,code_hash,expires_at,attempts")
      .eq("user_id", data.user.id)
      .eq("email", data.user.email.trim().toLowerCase())
      .maybeSingle();
    if (challengeError || !challenge) return json({ error: "No active code was found. Request a new code and try again." }, 400);
    if (challenge.attempts >= 5 || Date.parse(challenge.expires_at) <= Date.now()) {
      await config.service.from("login_email_challenges").delete().eq("user_id", data.user.id);
      return json({ error: "That code has expired or had too many attempts. Request a new code." }, 400);
    }

    const submittedHash = await codeDigest(data.user.id, code, pepper);
    if (!safeEqual(submittedHash, challenge.code_hash)) {
      const { data: attempts, error: attemptError } = await config.service.rpc("record_login_email_code_attempt", {
        p_user_id: data.user.id,
        p_code_hash: challenge.code_hash,
      });
      if (attemptError) throw attemptError;
      if (attempts === null) return json({ error: "That code is no longer active. Request a new code." }, 400);
      return json({ error: Number(attempts) >= 5 ? "Too many incorrect codes. Request a new code." : "That verification code is incorrect." }, 400);
    }

    const { data: consumed, error: consumeError } = await config.service.rpc("consume_login_email_code", {
      p_user_id: data.user.id,
      p_code_hash: challenge.code_hash,
    });
    if (consumeError) {
      console.error("verify-login-email-code: could not consume challenge", consumeError.message);
      return json({ error: "Could not complete verification. Please request a new code." }, 503);
    }
    if (consumed !== true) return json({ error: "That code has expired or was already used. Request a new code." }, 400);

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error("verify-login-email-code failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not verify the code. Please try again." }, 500);
  }
});
