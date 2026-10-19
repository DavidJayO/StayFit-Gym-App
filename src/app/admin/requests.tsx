import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { AdminRequestKind, errorMessage, formatAdminDate, loadAdminRequests, reviewAdminRequest } from "../../lib/admin-data";
import { supabase } from "../../lib/supabase";

export default function AdminRequests() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await loadAdminRequests()); } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function review(row: any, status: "approved" | "rejected") {
    setBusyId(row.id); setError("");
    try {
      if (row.kind === "plan" && status === "approved") {
        const { data, error: verifyError } = await supabase.functions.invoke("verify-paypal-plan-payment", { body: { request_id: row.id } });
        if (verifyError) {
          const responseBody = await (verifyError as any).context?.json?.().catch(() => null);
          throw new Error(responseBody?.error || verifyError.message);
        }
        if (data?.error) throw new Error(data.error);
        if (!data?.paid || !data?.activated) throw new Error(`PayPal still reports this invoice as ${String(data?.paypal_status || "unpaid").toLowerCase()}. The membership was not activated.`);
      } else {
        await reviewAdminRequest(row.kind as AdminRequestKind, row.id, status);
      }
      await load();
    }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusyId(""); }
  }

  const pending = rows.filter((row) => row.status === "pending");
  return <AdminScreen title="Member Requests">
    <AdminMessage tone="info">Review member requests here. For a plan request, check the PayPal sandbox invoice. Choose “Verify PayPal & activate” only after PayPal reports the invoice as paid; the app verifies the invoice and activates the membership together.</AdminMessage>
    {error ? <AdminMessage>{error}</AdminMessage> : null}
    <AdminSectionTitle>{loading ? "Loading requests" : `${pending.length} pending · ${rows.length} total`}</AdminSectionTitle>
    {loading && rows.length === 0 ? <AdminLoading /> : rows.length === 0 ? <AdminPanel><Text style={styles.muted}>No member requests have been submitted.</Text></AdminPanel> : rows.map((row) => <AdminPanel key={`${row.kind}-${row.id}`} style={styles.card}>
      <View style={styles.top}><View style={styles.icon}><Ionicons name={row.kind === "freeze" ? "snow-outline" : row.kind === "daily_pass" ? "ticket-outline" : row.kind === "plan" ? "card-outline" : "refresh-outline"} size={18} color={C.blue} /></View><View style={{ flex: 1 }}><Text style={styles.title}>{row.kind === "freeze" ? "Membership freeze" : row.kind === "daily_pass" ? "Daily pass" : row.kind === "plan" ? "New plan application" : "Renewal"}</Text><Text style={styles.muted}>{row.profiles?.full_name || "Member"} · {formatAdminDate(row.created_at)}</Text></View><Text style={[styles.badge, row.status === "pending" ? styles.pending : row.status === "approved" ? styles.approved : styles.rejected]}>{String(row.status).toUpperCase()}</Text></View>
      <Text style={styles.detail}>{row.detail}</Text>
      {row.kind === "plan" ? <View style={styles.paymentBox}>
        <Text style={styles.paymentTitle}>PAYMENT · {String(row.payment_status || "not_submitted").replaceAll("_", " ").toUpperCase()}</Text>
        <Text style={styles.paymentDetail}>Method: {row.payment_method || "Not started"}</Text>
        {row.paypal_invoice_id ? <Text style={styles.paymentDetail}>PayPal invoice: {row.paypal_invoice_id}</Text> : null}
        {row.payment_status === "submitted" ? <Text style={styles.verifyHint}>Check the invoice with PayPal before activating this plan.</Text> : row.status === "pending" ? <Text style={styles.verifyHint}>Waiting for the member to create a PayPal invoice.</Text> : null}
      </View> : null}
      <TouchableOpacity style={styles.manageMember} onPress={() => router.push(`/admin/member/${row.user_id}` as never)}><Text style={styles.manageText}>Open member record</Text><Ionicons name="chevron-forward" size={14} color={C.blue} /></TouchableOpacity>
      {row.status === "pending" ? <View style={styles.actions}><TouchableOpacity disabled={busyId === row.id} style={[styles.button, styles.rejectButton]} onPress={() => void review(row, "rejected")}><Text style={styles.rejectText}>Reject</Text></TouchableOpacity>{row.kind === "plan" && !row.paypal_invoice_id ? <View style={[styles.button, styles.waitButton]}><Text style={styles.waitText}>Awaiting PayPal</Text></View> : <TouchableOpacity disabled={busyId === row.id} style={[styles.button, styles.approveButton]} onPress={() => void review(row, "approved")}><Text style={styles.approveText}>{busyId === row.id ? "Checking PayPal…" : row.kind === "plan" ? "Verify PayPal & activate" : "Approve"}</Text></TouchableOpacity>}</View> : null}
    </AdminPanel>)}
  </AdminScreen>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 9 },
  top: { flexDirection: "row", alignItems: "center", gap: 9 },
  icon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.panelDeep, alignItems: "center", justifyContent: "center" },
  title: { color: C.text, fontSize: 11, fontWeight: "800" },
  muted: { color: C.muted, fontSize: 9, marginTop: 4 },
  detail: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 11 },
  paymentBox: { backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.border, borderRadius: 9, padding: 10, marginTop: 10 },
  paymentTitle: { color: C.text, fontSize: 9, fontWeight: "800", marginBottom: 5 },
  paymentDetail: { color: C.muted, fontSize: 9, lineHeight: 14 },
  verifyHint: { color: "#F4C95D", fontSize: 9, lineHeight: 14, marginTop: 5 },
  manageMember: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: C.border, marginTop: 11, paddingTop: 10 },
  manageText: { color: C.blue, fontSize: 9, fontWeight: "800" },
  badge: { fontSize: 7, fontWeight: "800", paddingHorizontal: 7, paddingVertical: 5, borderRadius: 10, overflow: "hidden" },
  pending: { color: "#F4C95D", backgroundColor: "#40351D" },
  approved: { color: C.green, backgroundColor: "#123D2A" },
  rejected: { color: C.red, backgroundColor: "#351B25" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  button: { minWidth: 78, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: "center" },
  rejectButton: { borderColor: C.borderBright, borderWidth: 1, backgroundColor: C.panelDeep },
  approveButton: { backgroundColor: C.blueStrong },
  rejectText: { color: C.muted, fontSize: 9, fontWeight: "800" },
  approveText: { color: C.text, fontSize: 9, fontWeight: "800" },
  waitButton: { backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.border, minWidth: 122 },
  waitText: { color: C.muted, fontSize: 9, fontWeight: "800" },
});
