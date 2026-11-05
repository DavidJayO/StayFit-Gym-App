import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, getErrorMessage, loadMembership } from "../../lib/member-data";

type Payment = { id: string; description: string; amount: number; payment_method: string; paid_at: string | null; created_at: string };
const BLUE = "#1769FF";

export default function MembershipCancellationScreen() {
  useThemeMode();
  const [membership, setMembership] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [reason, setReason] = useState("");
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void (async () => {
    try {
      const [m, userId] = await Promise.all([loadMembership(), currentUserId()]);
      setMembership(m);
      const [paymentResult, requestResult] = await Promise.all([
        m?.membership_plan_request_id ? supabase.from("payments").select("id,description,amount,payment_method,paid_at,created_at").eq("user_id", userId).eq("membership_plan_request_id", m.membership_plan_request_id).eq("status", "paid").order("paid_at", { ascending: false }).limit(1) : Promise.resolve({ data: [], error: null } as any),
        supabase.from("membership_cancellation_requests").select("status,refund_status,created_at,refund_reference").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (paymentResult.error) throw paymentResult.error;
      if (requestResult.error) throw requestResult.error;
      const matching = paymentResult.data ?? [];
      setPayments(matching);
      if (matching.length) setSelectedPayment(matching[0].id);
      setLatestRequest(requestResult.data);
    } catch (e) { setError(getErrorMessage(e)); }
  })(); }, []);

  useEffect(() => {
    if (latestRequest?.status !== "approved" || !["issued", "not_requested"].includes(latestRequest.refund_status)) return;
    const timer = setTimeout(() => router.replace("/member/dashboard" as never), 900);
    return () => clearTimeout(timer);
  }, [latestRequest]);

  useEffect(() => {
    if (!latestRequest || latestRequest.status === "rejected" || latestRequest.status === "cancelled" || latestRequest.status === "approved" && latestRequest.refund_status !== "requested") return;
    let mounted = true;
    const timer = setInterval(() => {
      void currentUserId().then((userId) => supabase.from("membership_cancellation_requests")
        .select("status,refund_status,created_at,refund_reference")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle())
        .then(({ data, error: requestError }) => { if (mounted && !requestError && data) setLatestRequest(data); });
    }, 5000);
    return () => { mounted = false; clearInterval(timer); };
  }, [latestRequest]);

  async function submit() {
    if (!membership || !["active", "frozen"].includes(membership.status)) {
      setError("Only an active or frozen membership can be submitted for cancellation.");
      return;
    }
    setBusy(true); setError("");
    try {
      const userId = await currentUserId();
      const { error: insertError } = await supabase.from("membership_cancellation_requests").insert({
        user_id: userId,
        membership_id: membership.id,
        payment_id: selectedPayment || null,
        reason: reason.trim(),
        refund_status: selectedPayment ? "requested" : "not_requested",
      });
      if (insertError) throw insertError;
      setLatestRequest({ status: "pending", refund_status: selectedPayment ? "requested" : "not_requested", created_at: new Date().toISOString() });
      Alert.alert("Request submitted", "The admin will review your cancellation and refund request.");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  }

  return <View style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/member/dashboard" as never)}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /><Text style={styles.backText}>Back to Dashboard</Text></TouchableOpacity>
    <Text style={styles.header}>Cancel Membership</Text>
    <Text style={styles.subtitle}>Send a cancellation request to the gym. The admin will review it before changing your membership.</Text>
    <View style={styles.panel}>
      <Text style={styles.label}>CURRENT MEMBERSHIP</Text>
      <Text style={styles.plan}>{membership?.plan_name ?? "Loading membership…"}</Text>
      <Text style={styles.muted}>Status: {membership?.status?.toUpperCase() ?? "—"}</Text>
    </View>
    {latestRequest ? <View style={styles.panel}>
      <Text style={styles.label}>LATEST REQUEST · {String(latestRequest.status).toUpperCase()}</Text>
      <Text style={styles.muted}>{latestRequest.refund_status === "issued" ? `Refund recorded · ${latestRequest.refund_reference}` : latestRequest.refund_status === "requested" ? "Refund request awaits admin review and manual PayPal processing." : "Cancellation request only; no refund was requested."}</Text>
    </View> : null}
    <Text style={styles.sectionTitle}>Request a refund</Text>
    <Text style={styles.muted}>Select a paid membership transaction to request a refund. This does not issue the PayPal refund automatically.</Text>
    <TouchableOpacity style={[styles.paymentOption, !selectedPayment && styles.selectedPayment]} onPress={() => setSelectedPayment("")}>
      <Ionicons name={!selectedPayment ? "radio-button-on" : "radio-button-off"} size={18} color={BLUE} />
      <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>Cancellation only</Text><Text style={styles.muted}>Do not request a refund</Text></View>
    </TouchableOpacity>
    {payments.map((payment) => <TouchableOpacity key={payment.id} style={[styles.paymentOption, selectedPayment === payment.id && styles.selectedPayment]} onPress={() => setSelectedPayment(payment.id)}>
      <Ionicons name={selectedPayment === payment.id ? "radio-button-on" : "radio-button-off"} size={18} color={BLUE} />
      <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>{payment.description} · ₱{Number(payment.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text><Text style={styles.muted}>{payment.payment_method} · {new Date(payment.paid_at ?? payment.created_at).toLocaleDateString()}</Text></View>
    </TouchableOpacity>)}
    <Text style={styles.sectionTitle}>Reason (optional)</Text>
    <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Tell us why you are requesting cancellation…" placeholderTextColor="#64748B" multiline maxLength={300} textAlignVertical="top" />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={20} color="#4D8DFF" /><Text style={styles.noticeText}>Your membership stays active until the admin approves cancellation. If a refund is approved, the gym will issue it separately through PayPal and record it here.</Text></View>
    <TouchableOpacity style={[styles.submitButton, (busy || !!latestRequest && latestRequest.status === "pending") && { opacity: 0.55 }]} disabled={busy || latestRequest?.status === "pending"} onPress={() => void submit()}><Text style={styles.buttonText}>{busy ? "Submitting…" : latestRequest?.status === "pending" ? "Request Pending" : "Submit Cancellation Request"}</Text><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></TouchableOpacity>
  </ScrollView></View>;
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" }, content: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 }, backText: { color: "#D0D5DD", fontSize: 13 },
  header: { color: "#FFFFFF", fontSize: 25, fontWeight: "700" }, subtitle: { color: "#98A2B3", fontSize: 13, marginTop: 6, marginBottom: 20, lineHeight: 19 },
  panel: { backgroundColor: "#102131", borderWidth: 1, borderColor: "#1D3A55", borderRadius: 14, padding: 15, marginBottom: 12 }, label: { color: "#98A2B3", fontSize: 10, letterSpacing: 1, fontWeight: "700" }, plan: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginTop: 7 }, muted: { color: "#98A2B3", fontSize: 11, lineHeight: 17, marginTop: 4 },
  sectionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginTop: 18, marginBottom: 8 }, paymentOption: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: "#102131", borderWidth: 1, borderColor: "#24394A", borderRadius: 12, padding: 13, marginTop: 9 }, selectedPayment: { borderColor: BLUE, backgroundColor: "#122D50" }, paymentTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" }, input: { minHeight: 92, backgroundColor: "#0B1A28", borderColor: "#24394A", borderWidth: 1, borderRadius: 12, padding: 14, color: "#FFFFFF", fontSize: 13 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "#102131", borderRadius: 12, padding: 13, marginTop: 18 }, noticeText: { color: "#D0D5DD", fontSize: 11, flex: 1, lineHeight: 17 }, error: { color: "#FF8585", fontSize: 12, marginTop: 12 },
  submitButton: { backgroundColor: BLUE, borderRadius: 12, padding: 15, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, buttonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
