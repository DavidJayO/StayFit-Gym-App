import { supabase } from "./supabase";

export async function requireAdmin() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Please sign in with an administrator account.");
  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", auth.user.id).single();
  if (error) throw error;
  if (profile.role !== "admin") throw new Error("This page is available to administrators only.");
  return auth.user.id;
}

export function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function loadAdminOverview() {
  await requireAdmin();
  const today = todayRange();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [members, active, attendance, paid, pendingFreezes, pendingPasses, pendingRenewals, pendingPlans, classes, bookings] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "member"),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active").lte("starts_on", new Date().toISOString().slice(0, 10)).gte("ends_on", new Date().toISOString().slice(0, 10)),
    supabase.from("attendance").select("id", { count: "exact", head: true }).gte("checked_in_at", today.start).lt("checked_in_at", today.end),
    supabase.from("payments").select("amount").eq("status", "paid").gte("paid_at", monthStart.toISOString()),
    supabase.from("freeze_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("daily_pass_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("membership_renewal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("membership_plan_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("gym_classes").select("id,name,category,trainer_name,starts_at,duration_minutes,capacity").eq("is_active", true).gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
    supabase.from("class_bookings").select("id,status,created_at,profiles(full_name),gym_classes(name)").order("created_at", { ascending: false }).limit(4),
  ]);
  const resultErrors = [members.error, active.error, attendance.error, paid.error, pendingFreezes.error, pendingPasses.error, pendingRenewals.error, pendingPlans.error, classes.error, bookings.error].filter(Boolean);
  if (resultErrors.length) throw resultErrors[0];
  return {
    members: members.count ?? 0,
    activeMemberships: active.count ?? 0,
    checkIns: attendance.count ?? 0,
    revenue: (paid.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0),
    pendingRequests: (pendingFreezes.count ?? 0) + (pendingPasses.count ?? 0) + (pendingRenewals.count ?? 0) + (pendingPlans.count ?? 0),
    classes: classes.data ?? [],
    bookings: bookings.data ?? [],
  };
}

export async function loadAdminMembers() {
  await requireAdmin();
  const { data: profiles, error } = await supabase.from("profiles").select("id,full_name,email,phone,created_at").eq("role", "member").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  const ids = (profiles ?? []).map((profile) => profile.id);
  const { data: memberships, error: membershipError } = ids.length
    ? await supabase.from("memberships").select("user_id,plan_name,status,ends_on").in("user_id", ids).order("ends_on", { ascending: false })
    : { data: [], error: null };
  if (membershipError) throw membershipError;
  const latest = new Map<string, any>();
  for (const membership of memberships ?? []) if (!latest.has(membership.user_id)) latest.set(membership.user_id, membership);
  return (profiles ?? []).map((profile) => ({ ...profile, membership: latest.get(profile.id) ?? null }));
}

export async function loadAdminMemberDetail(userId: string) {
  await requireAdmin();
  const [profile, memberships, bookings, attendance, payments] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,phone,role,created_at").eq("id", userId).eq("role", "member").single(),
    supabase.from("memberships").select("id,plan_name,status,starts_on,ends_on,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("class_bookings").select("id,status,created_at,gym_classes(name,starts_at,trainer_name)").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("attendance").select("id,checked_in_at,checked_out_at").eq("user_id", userId).order("checked_in_at", { ascending: false }).limit(20),
    supabase.from("payments").select("id,description,amount,payment_method,status,paid_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
  ]);
  const error = profile.error ?? memberships.error ?? bookings.error ?? attendance.error ?? payments.error;
  if (error) throw error;
  if (!profile.data) throw new Error("Member record not found.");
  return { profile: profile.data, memberships: memberships.data ?? [], bookings: bookings.data ?? [], attendance: attendance.data ?? [], payments: payments.data ?? [] };
}

export async function saveAdminMemberProfile(userId: string, fullName: string, phone: string) {
  await requireAdmin();
  const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() }).eq("id", userId).eq("role", "member");
  if (error) throw error;
}

export async function saveAdminMembership(input: { userId: string; id?: string; planName: string; status: "active" | "expired" | "frozen" | "cancelled"; startsOn: string; endsOn: string }) {
  await requireAdmin();
  const values = { user_id: input.userId, plan_name: input.planName.trim(), status: input.status, starts_on: input.startsOn, ends_on: input.endsOn };
  const result = input.id
    ? await supabase.from("memberships").update(values).eq("id", input.id).eq("user_id", input.userId)
    : await supabase.from("memberships").insert(values);
  if (result.error) throw result.error;
}

export async function addAdminPayment(input: { userId: string; description: string; amount: number; method: string; status: "pending" | "paid" }) {
  await requireAdmin();
  const { error } = await supabase.from("payments").insert({ user_id: input.userId, description: input.description.trim(), amount: input.amount, payment_method: input.method, status: input.status, paid_at: input.status === "paid" ? new Date().toISOString() : null });
  if (error) throw error;
}

export async function sendMemberNotification(userId: string, title: string, body: string) {
  await requireAdmin();
  const { error } = await supabase.from("member_notifications").insert({ user_id: userId, title: title.trim(), body: body.trim() });
  if (error) throw error;
}

export async function recordMemberCheckIn(userId: string) {
  const adminId = await requireAdmin();
  const { data: openVisit, error: visitError } = await supabase.from("attendance").select("id").eq("user_id", userId).is("checked_out_at", null).maybeSingle();
  if (visitError) throw visitError;
  if (openVisit) throw new Error("This member is already checked in.");
  const { error } = await supabase.from("attendance").insert({ user_id: userId, recorded_by: adminId });
  if (error) throw error;
}

export async function recordMemberCheckOut(attendanceId: string) {
  await requireAdmin();
  const { error } = await supabase.from("attendance").update({ checked_out_at: new Date().toISOString() }).eq("id", attendanceId).is("checked_out_at", null);
  if (error) throw error;
}

export async function setAdminBookingStatus(id: string, status: "approved" | "rejected" | "cancelled") {
  await requireAdmin();
  const { error } = await supabase.from("class_bookings").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function loadAdminBookings() {
  await requireAdmin();
  const { data, error } = await supabase
    .from("class_bookings")
    .select("id,status,created_at,profiles(full_name,email),gym_classes(name,category,trainer_name,starts_at,duration_minutes,capacity)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function loadAdminClasses() {
  await requireAdmin();
  const { data, error } = await supabase.from("gym_classes").select("id,name,category,trainer_name,starts_at,duration_minutes,capacity,is_active").order("starts_at", { ascending: true }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function createGymClass(input: { name: string; category: string; trainer: string; startsAt: string; duration: number; capacity: number }) {
  await requireAdmin();
  const { error } = await supabase.from("gym_classes").insert({ name: input.name.trim(), category: input.category.trim(), trainer_name: input.trainer.trim(), starts_at: input.startsAt, duration_minutes: input.duration, capacity: input.capacity, is_active: true });
  if (error) throw error;
}

export async function setGymClassActive(id: string, isActive: boolean) {
  await requireAdmin();
  const { error } = await supabase.from("gym_classes").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function loadAdminPayments() {
  await requireAdmin();
  const { data, error } = await supabase.from("payments").select("id,description,amount,payment_method,status,paid_at,created_at,membership_plan_request_id,daily_pass_request_id,profiles(full_name)").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export type AdminRequestKind = "freeze" | "daily_pass" | "renewal" | "plan";
export type AdminRequestStatus = "approved" | "rejected";

export async function loadAdminRequests() {
  await requireAdmin();
  const [freezes, passes, renewals, plans] = await Promise.all([
    supabase.from("freeze_requests").select("id,user_id,duration_days,reason,status,created_at,profiles!freeze_requests_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("daily_pass_requests").select("id,user_id,visit_on,amount,payment_method,status,payment_status,checked_in_at,paypal_invoice_id,paypal_invoice_url,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("membership_renewal_requests").select("id,user_id,membership_id,status,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("membership_plan_requests").select("id,user_id,plan_name,amount,billing_period,status,payment_status,payment_method,payment_reference,payment_submitted_at,paypal_invoice_id,paypal_invoice_url,created_at,profiles!membership_plan_requests_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(100),
  ]);
  const error = freezes.error ?? passes.error ?? renewals.error ?? plans.error;
  if (error) throw error;
  return [
    ...(freezes.data ?? []).map((row) => ({ ...row, kind: "freeze" as const, detail: `${row.duration_days} day freeze · ${row.reason}` })),
    ...(passes.data ?? []).map((row) => ({ ...row, kind: "daily_pass" as const, detail: `${formatAdminDate(row.visit_on)} · ₱${Number(row.amount).toLocaleString()} · ${row.payment_method}` })),
    ...(renewals.data ?? []).map((row) => ({ ...row, kind: "renewal" as const, detail: "Membership renewal request" })),
    ...(plans.data ?? []).map((row) => ({ ...row, kind: "plan" as const, detail: `${row.plan_name} · ₱${Number(row.amount).toLocaleString("en-PH")} / ${row.billing_period}` })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function reviewAdminRequest(kind: AdminRequestKind, id: string, status: AdminRequestStatus) {
  await requireAdmin();
  if (kind === "plan") {
    const { error } = await supabase.rpc("admin_review_plan_request", { p_request_id: id, p_status: status });
    if (error) throw error;
    return;
  }
  if (kind === "daily_pass") {
    const { error } = await supabase.rpc("admin_review_daily_pass_request", { p_request_id: id, p_status: status });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.rpc("admin_review_member_request", { p_kind: kind, p_request_id: id, p_status: status });
  if (error) throw error;
}

export async function setPaymentStatus(id: string, status: "paid" | "failed" | "refunded") {
  await requireAdmin();
  const { error } = await supabase.from("payments").update({ status, paid_at: status === "paid" ? new Date().toISOString() : null }).eq("id", id).is("membership_plan_request_id", null);
  if (error) throw error;
}

export function formatAdminDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatAdminTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Something went wrong. Please try again.";
}
