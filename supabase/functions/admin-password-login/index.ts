import { backendConfig, corsHeaders, credentials, json, requestBody } from "../_shared/email-login.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const config = backendConfig();
  if (!config) return json({ error: "Admin login is not configured on the server." }, 503);

  const login = credentials(await requestBody(req));
  if (!login) return json({ error: "Enter a valid email address and password." }, 400);

  try {
    const { data, error } = await config.auth.auth.signInWithPassword(login);
    if (error || !data.user?.id || !data.session) {
      if (error?.code === "email_not_confirmed") {
        return json({ error: "Confirm your email address before signing in." }, 403);
      }
      return json({ error: "Email or password is incorrect." }, 401);
    }

    const { data: profile, error: profileError } = await config.service
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError || !profile) return json({ error: "Your StayFit profile could not be loaded." }, 403);
    if (profile.role !== "admin") {
      return json({ error: "Member accounts must enter an email code. Choose Member to continue." }, 403);
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error("admin-password-login failed", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Could not sign in as admin. Please try again." }, 500);
  }
});
