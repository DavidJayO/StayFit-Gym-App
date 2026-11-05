import { supabase } from "./supabase";

export type AppRole = "member" | "admin";

async function invokeLoginFunction(name: string, body: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const context = (error as { context?: unknown }).context as { clone?: () => { json: () => Promise<{ error?: string }> } } | undefined;
    if (context && typeof context.clone === "function") {
      const responseBody = await context.clone().json().catch(() => null);
      if (responseBody?.error) throw new Error(responseBody.error);
    }
    throw error;
  }
  return data as Record<string, unknown>;
}

export async function requestLoginEmailCode(email: string, password: string) {
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) throw signOutError;
  await invokeLoginFunction("request-login-email-code", {
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signInAdminWithPassword(email: string, password: string) {
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) throw signOutError;

  const data = await invokeLoginFunction("admin-password-login", {
    email: email.trim().toLowerCase(),
    password,
  });
  if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string") {
    throw new Error("The admin login response was incomplete. Please try again.");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (sessionError) throw sessionError;
}

export async function verifyLoginEmailCode(email: string, password: string, code: string) {
  const data = await invokeLoginFunction("verify-login-email-code", {
    email: email.trim().toLowerCase(),
    password,
    code: code.trim(),
  });
  if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string") {
    throw new Error("The verification response was incomplete. Request a new code and try again.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (sessionError || !sessionData.user) throw sessionError ?? new Error("Could not start your session.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sessionData.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    if (profileError.code === "PGRST116") {
      throw new Error("Your email was verified, but your StayFit profile is missing. Check that this user has a row in public.profiles.");
    }
    throw new Error(`Verified, but could not load your member profile: ${profileError.message}`);
  }

  return profile.role as AppRole;
}

export async function signUp(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
      },
    },
  });

  if (error) throw error;
  if (data.user?.identities?.length === 0) {
    throw new Error("This email is already registered. Sign in with that account or use a different email address.");
  }
  return { needsEmailConfirmation: !data.session };
}

export async function resendSignupConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
  });
  if (error) throw error;
}
