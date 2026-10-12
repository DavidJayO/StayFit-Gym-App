import { supabase } from "./supabase";

export type AppRole = "member" | "admin";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    if (profileError.code === "PGRST116") {
      throw new Error("Your login succeeded, but your StayFit profile is missing. Check that the database migration ran and that this user has a row in public.profiles.");
    }
    throw new Error(`Signed in, but could not load your member profile: ${profileError.message}`);
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
  return { needsEmailConfirmation: !data.session };
}
