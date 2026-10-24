import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { errorMessage, formatAdminDate, loadAdminPayments, setPaymentStatus } from "../../lib/admin-data";

export default function AdminPayments() {
  useThemeMode();
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await loadAdminPayments()); } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function update(id: string, status: "paid" | "failed" | "refunded") {
    setBusyId(id); setError("");
    try { await setPaymentStatus(id, status); await load(); } catch (e) { setError(errorMessage(e)); } finally { setBusyId(""); }
  }

  return <AdminScreen title="Payments">
    <AdminMessage tone="info">Record cash payments here. Daily pass PayPal invoices are verified in Member Requests. A verified daily pass gets its entry QR for the visit date.</AdminMessage>
    {error ? <AdminMessage>{error}</AdminMessage> : null}
    <AdminSectionTitle>{loading ? "Loading transactions" : `${rows.length} recent transactions`}</AdminSectionTitle>
    {loading && rows.length === 0 ? <AdminLoading /> : rows.length === 0 ? <AdminPanel><Text style={styles.muted}>No payment records are in the database yet.</Text></AdminPanel> : rows.map((row) => <AdminPanel key={row.id} style={styles.card}>
      <View style={styles.top}><View style={{ flex: 1 }}><Text style={styles.title}>{row.description}</Text><Text style={styles.muted}>{row.profiles?.full_name || "Member"} · {row.payment_method}</Text></View><Text style={styles.amount}>₱{Number(row.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text></View>
      <View style={styles.metaRow}><Text style={styles.muted}>Recorded {formatAdminDate(row.created_at)}</Text><Text style={[styles.badge, row.status === "paid" ? styles.paid : row.status === "pending" ? styles.pending : styles.other]}>{String(row.status).toUpperCase()}</Text></View>
      {row.membership_plan_request_id ? <View style={styles.action}><Text style={styles.actionText}>Verify and activate in Member Requests</Text></View> : row.status !== "paid" ? <TouchableOpacity disabled={busyId === row.id} style={styles.action} onPress={() => void update(row.id, "paid")}><Text style={styles.actionText}>{busyId === row.id ? "Updating…" : "Mark as paid"}</Text></TouchableOpacity> : <TouchableOpacity disabled={busyId === row.id} style={styles.action} onPress={() => void update(row.id, "refunded")}><Text style={styles.actionText}>Mark as refunded</Text></TouchableOpacity>}
      {row.daily_pass_request_id && row.status === "paid" ? <View style={styles.action}><Text style={styles.actionText}>Daily pass entry QR issued for the visit date</Text></View> : null}
    </AdminPanel>)}
  </AdminScreen>;
}

const styles = createThemeStyles({
  card: { marginBottom: 9 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: { color: C.text, fontSize: 11, fontWeight: "800" },
  muted: { color: C.muted, fontSize: 9, marginTop: 5 },
  amount: { color: C.text, fontSize: 12, fontWeight: "800" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  badge: { fontSize: 7, fontWeight: "800", paddingHorizontal: 7, paddingVertical: 5, borderRadius: 10, overflow: "hidden" },
  paid: { color: C.green, backgroundColor: "#123D2A" },
  pending: { color: "#F4C95D", backgroundColor: "#40351D" },
  other: { color: C.muted, backgroundColor: C.panelDeep },
  action: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 11, marginTop: 11 },
  actionText: { color: C.blue, fontSize: 10, fontWeight: "800" },
});
