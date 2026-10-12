import { supabase } from "./supabase";

export type Membership = {
  id: string;
  plan_name: string;
  status: "active" | "expired" | "frozen" | "cancelled";
  starts_on: string;
  ends_on: string;
};

export async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to access member data.");
  return data.user.id;
}

export async function loadProfile() {
  const userId = await currentUserId();
  const [{ data: profile, error: profileError }, { data: user }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,phone,role").eq("id", userId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (profileError) throw profileError;
  return { ...(profile ?? { id: userId, full_name: "", phone: "", role: "member" }), email: user.user?.email ?? "" };
}

export async function loadMembership() {
  const userId = await currentUserId();
  const { data, error } = await supabase.from("memberships").select("id,plan_name,status,starts_on,ends_on")
    .eq("user_id", userId).order("ends_on", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as Membership | null;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
