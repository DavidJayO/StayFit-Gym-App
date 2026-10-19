import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdminButton, AdminColors as C, AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle } from "../../../components/admin-ui";
import {
  addAdminPayment,
  errorMessage,
  formatAdminDate,
  formatAdminTime,
  loadAdminMemberDetail,
  recordMemberCheckIn,
  recordMemberCheckOut,
  saveAdminMemberProfile,
  saveAdminMembership,
  sendMemberNotification,
  setAdminBookingStatus,
} from "../../../lib/admin-data";

type Detail = Awaited<ReturnType<typeof loadAdminMemberDetail>>;
type MembershipStatus = "active" | "expired" | "frozen" | "cancelled";

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default function AdminMemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "" });
  const [membershipForm, setMembershipForm] = useState({ id: "", planName: "", status: "active" as MembershipStatus, startsOn: localDate(), endsOn: localDate(new Date(Date.now() + 30 * 86_400_000)) });
  const [paymentForm, setPaymentForm] = useState({ description: "", amount: "", method: "Cash", status: "paid" as "paid" | "pending" });
  const [notificationForm, setNotificationForm] = useState({ title: "", body: "" });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const value = await loadAdminMemberDetail(id);
      setDetail(value);
      setProfileForm({ fullName: value.profile.full_name ?? "", phone: value.profile.phone ?? "" });
      const current = value.memberships[0];
      if (current) setMembershipForm({ id: current.id, planName: current.plan_name, status: current.status, startsOn: current.starts_on, endsOn: current.ends_on });
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function act(action: () => Promise<void>, success?: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); await load(); if (success) setNotice(success); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  function startNewMembership() {
    setMembershipForm({ id: "", planName: "", status: "active", startsOn: localDate(), endsOn: localDate(new Date(Date.now() + 30 * 86_400_000)) });
  }

  async function saveMembership() {
    if (!id || !membershipForm.planName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(membershipForm.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(membershipForm.endsOn) || membershipForm.endsOn < membershipForm.startsOn) {
      setError("Enter a plan name and valid dates in YYYY-MM-DD format; end date must be on or after start date."); return;
    }
    await act(() => saveAdminMembership({ userId: id, id: membershipForm.id || undefined, planName: membershipForm.planName, status: membershipForm.status, startsOn: membershipForm.startsOn, endsOn: membershipForm.endsOn }), "Membership saved.");
  }

  async function addPayment() {
    const amount = Number(paymentForm.amount);
    if (!id || !paymentForm.description.trim() || !Number.isFinite(amount) || amount <= 0) { setError("Enter a description and an amount greater than zero."); return; }
    await act(() => addAdminPayment({ userId: id, description: paymentForm.description, amount, method: paymentForm.method, status: paymentForm.status }), "Payment record added.");
    setPaymentForm({ description: "", amount: "", method: "Cash", status: "paid" });
  }

  async function notifyMember() {
    if (!id || !notificationForm.title.trim()) { setError("Enter a notification title."); return; }
    await act(() => sendMemberNotification(id, notificationForm.title, notificationForm.body), "Notification sent to this member.");
    setNotificationForm({ title: "", body: "" });
  }

  if (loading && !detail) return <AdminScreen title="Member" backRoute="/admin/members"><AdminLoading /></AdminScreen>;
  if (!detail) return <AdminScreen title="Member" backRoute="/admin/members">{error ? <AdminMessage>{error}</AdminMessage> : <AdminMessage>Member record not found.</AdminMessage>}</AdminScreen>;

  const openVisit = detail.attendance.find((row) => !row.checked_out_at);
  return <AdminScreen title="Member details" backRoute="/admin/members">
    {error ? <AdminMessage>{error}</AdminMessage> : null}
    {notice ? <AdminMessage tone="info">{notice}</AdminMessage> : null}

    <AdminPanel style={styles.memberSummary}>
      <View style={styles.avatar}><Ionicons name="person" size={22} color={C.blue} /></View>
      <Text style={styles.memberName}>{detail.profile.full_name || "Unnamed member"}</Text>
      <Text style={styles.muted}>{detail.profile.email || "No email on file"}</Text>
      <Text style={styles.muted}>{detail.profile.phone || "No phone number"}</Text>
      <Text style={styles.muted}>Member since {formatAdminDate(detail.profile.created_at)}</Text>
    </AdminPanel>

    <AdminSectionTitle>Member profile</AdminSectionTitle>
    <AdminPanel>
      <Field label="Full name" value={profileForm.fullName} onChangeText={(fullName) => setProfileForm({ ...profileForm, fullName })} placeholder="Member name" />
      <Field label="Phone" value={profileForm.phone} onChangeText={(phone) => setProfileForm({ ...profileForm, phone })} placeholder="Phone number" keyboardType="phone-pad" />
      <AdminButton label={busy ? "Saving…" : "Save profile"} disabled={busy} onPress={() => void act(() => saveAdminMemberProfile(id, profileForm.fullName, profileForm.phone), "Member profile updated.")} />
    </AdminPanel>

    <AdminSectionTitle action={<TouchableOpacity onPress={startNewMembership}><Text style={styles.link}>+ New plan</Text></TouchableOpacity>}>Membership</AdminSectionTitle>
    <AdminPanel>
      {membershipForm.id ? <Text style={styles.muted}>Editing current record · {detail.memberships.length} total</Text> : <Text style={styles.muted}>Creating a new membership record</Text>}
      <Field label="Plan name" value={membershipForm.planName} onChangeText={(planName) => setMembershipForm({ ...membershipForm, planName })} placeholder="Monthly Premium" />
      <View style={styles.chips}>{(["active", "frozen", "expired", "cancelled"] as MembershipStatus[]).map((status) => <TouchableOpacity key={status} style={[styles.chip, membershipForm.status === status && styles.chipSelected]} onPress={() => setMembershipForm({ ...membershipForm, status })}><Text style={[styles.chipText, membershipForm.status === status && styles.chipTextSelected]}>{status.toUpperCase()}</Text></TouchableOpacity>)}</View>
      <View style={styles.fieldRow}><View style={{ flex: 1 }}><Field label="Starts (YYYY-MM-DD)" value={membershipForm.startsOn} onChangeText={(startsOn) => setMembershipForm({ ...membershipForm, startsOn })} placeholder="2026-10-20" /></View><View style={{ flex: 1 }}><Field label="Ends (YYYY-MM-DD)" value={membershipForm.endsOn} onChangeText={(endsOn) => setMembershipForm({ ...membershipForm, endsOn })} placeholder="2026-11-20" /></View></View>
      <AdminButton label={busy ? "Saving…" : membershipForm.id ? "Save membership" : "Assign membership"} disabled={busy} onPress={() => void saveMembership()} />
      {detail.memberships.map((membership) => <TouchableOpacity key={membership.id} style={styles.historyRow} onPress={() => setMembershipForm({ id: membership.id, planName: membership.plan_name, status: membership.status, startsOn: membership.starts_on, endsOn: membership.ends_on })}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{membership.plan_name} · {membership.status.toUpperCase()}</Text><Text style={styles.muted}>{formatAdminDate(membership.starts_on)} — {formatAdminDate(membership.ends_on)}</Text></View><Ionicons name="create-outline" size={17} color={C.blue} /></TouchableOpacity>)}
    </AdminPanel>

    <AdminSectionTitle>Attendance</AdminSectionTitle>
    <AdminPanel>
      <Text style={styles.muted}>{openVisit ? `Currently checked in since ${formatAdminTime(openVisit.checked_in_at)}` : "Member is not currently checked in."}</Text>
      <AdminButton label={busy ? "Saving…" : openVisit ? "Check out member" : "Check in member"} disabled={busy} onPress={() => void act(() => openVisit ? recordMemberCheckOut(openVisit.id) : recordMemberCheckIn(id), openVisit ? "Member checked out." : "Member checked in.")} />
      {detail.attendance.slice(0, 5).map((visit) => <View key={visit.id} style={styles.historyRow}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{formatAdminTime(visit.checked_in_at)}</Text><Text style={styles.muted}>{visit.checked_out_at ? `Checked out ${formatAdminTime(visit.checked_out_at)}` : "Still checked in"}</Text></View></View>)}
    </AdminPanel>

    <AdminSectionTitle>Class bookings</AdminSectionTitle>
    {detail.bookings.length === 0 ? <AdminPanel><Text style={styles.muted}>This member has no class bookings.</Text></AdminPanel> : detail.bookings.map((booking: any) => <AdminPanel key={booking.id} style={styles.listCard}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{booking.gym_classes?.name || "Class"}</Text><Text style={styles.muted}>{formatAdminTime(booking.gym_classes?.starts_at)} · {booking.gym_classes?.trainer_name || "Trainer not listed"}</Text></View><Text style={styles.state}>{booking.status.toUpperCase()}</Text>{booking.status === "pending" ? <View style={styles.bookingActions}><TouchableOpacity disabled={busy} onPress={() => void act(() => setAdminBookingStatus(booking.id, "rejected"))}><Text style={styles.reject}>Reject</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={() => void act(() => setAdminBookingStatus(booking.id, "approved"))}><Text style={styles.link}>Approve</Text></TouchableOpacity></View> : booking.status === "approved" ? <View style={styles.bookingActions}><TouchableOpacity disabled={busy} onPress={() => void act(() => setAdminBookingStatus(booking.id, "cancelled"))}><Text style={styles.reject}>Cancel</Text></TouchableOpacity></View> : null}</AdminPanel>)}

    <AdminSectionTitle>Add payment record</AdminSectionTitle>
    <AdminPanel>
      <Field label="Description" value={paymentForm.description} onChangeText={(description) => setPaymentForm({ ...paymentForm, description })} placeholder="Monthly membership" />
      <View style={styles.fieldRow}><View style={{ flex: 1 }}><Field label="Amount (PHP)" value={paymentForm.amount} onChangeText={(amount) => setPaymentForm({ ...paymentForm, amount })} placeholder="1500" keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Method" value={paymentForm.method} onChangeText={(method) => setPaymentForm({ ...paymentForm, method })} placeholder="Cash or GCash" /></View></View>
      <View style={styles.chips}>{(["paid", "pending"] as const).map((status) => <TouchableOpacity key={status} style={[styles.chip, paymentForm.status === status && styles.chipSelected]} onPress={() => setPaymentForm({ ...paymentForm, status })}><Text style={[styles.chipText, paymentForm.status === status && styles.chipTextSelected]}>{status.toUpperCase()}</Text></TouchableOpacity>)}</View>
      <AdminButton label={busy ? "Saving…" : "Add payment record"} disabled={busy} onPress={() => void addPayment()} />
    </AdminPanel>

    <AdminSectionTitle>Send member notification</AdminSectionTitle>
    <AdminPanel>
      <Field label="Title" value={notificationForm.title} onChangeText={(title) => setNotificationForm({ ...notificationForm, title })} placeholder="Membership update" />
      <Field label="Message" value={notificationForm.body} onChangeText={(body) => setNotificationForm({ ...notificationForm, body })} placeholder="Write a message for this member" multiline />
      <AdminButton label={busy ? "Sending…" : "Send notification"} disabled={busy} onPress={() => void notifyMember()} />
    </AdminPanel>
  </AdminScreen>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "phone-pad" | "decimal-pad"; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={C.dim} keyboardType={props.keyboardType ?? "default"} multiline={props.multiline} textAlignVertical={props.multiline ? "top" : "center"} style={[styles.input, props.multiline && styles.multiline]} /></View>;
}

const styles = StyleSheet.create({
  memberSummary: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  memberName: { color: C.text, fontSize: 15, fontWeight: "800" },
  muted: { color: C.muted, fontSize: 9, lineHeight: 15, marginTop: 4 },
  field: { marginBottom: 10 },
  label: { color: "#D0D5DD", fontSize: 9, fontWeight: "700", marginBottom: 5 },
  input: { minHeight: 41, backgroundColor: C.panelDeep, borderColor: C.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, color: C.text, fontSize: 11 },
  multiline: { minHeight: 78, paddingTop: 10 },
  fieldRow: { flexDirection: "row", gap: 9 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.panelDeep },
  chipSelected: { borderColor: C.blue, backgroundColor: "#122D50" },
  chipText: { color: C.muted, fontSize: 7, fontWeight: "800" },
  chipTextSelected: { color: C.blue },
  historyRow: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 9 },
  rowTitle: { color: C.text, fontSize: 10, fontWeight: "700" },
  listCard: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  state: { color: C.muted, fontSize: 7, fontWeight: "800" },
  bookingActions: { gap: 7 },
  reject: { color: C.red, fontSize: 8, fontWeight: "800" },
  link: { color: C.blue, fontSize: 9, fontWeight: "800" },
});
