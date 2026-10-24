import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { currentUserId, getErrorMessage } from "../../lib/member-data";
import { supabase } from "../../lib/supabase";

type PlanRequest = {
  id: string;
  plan_name: string;
  amount: number;
  billing_period: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  payment_status: "not_submitted" | "submitted" | "paid" | "verified" | "rejected";
  paypal_invoice_id: string | null;
  paypal_invoice_url: string | null;
};

async function getCheckoutError(error: unknown) {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context && typeof context === "object" && "json" in context && typeof (context as Response).json === "function") {
      try {
        const body = await (context as Response).clone().json();
        if (body && typeof body === "object" && typeof body.error === "string") return body.error;
        if (body && typeof body === "object" && typeof body.message === "string") return body.message;
      } catch { /* Fall back to the SDK error text when the response isn't JSON. */ }
    }
  }
  return getErrorMessage(error);
}

export default function PlanPayment() {
  useThemeMode();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [request, setRequest] = useState<PlanRequest | null>(null);
  const [paypalStatus, setPaypalStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoader = true) => {
    if (!id) { setError("The plan request could not be found."); setLoading(false); return; }
    if (showLoader) setLoading(true);
    setError("");
    try {
      const userId = await currentUserId();
      const { data, error: fetchError } = await supabase.from("membership_plan_requests")
        .select("id,plan_name,amount,billing_period,status,payment_status,paypal_invoice_id,paypal_invoice_url")
        .eq("id", id).eq("user_id", userId).single();
      if (fetchError) throw fetchError;
      const row = data as PlanRequest;
      setRequest(row);
      if (row.status === "pending" && row.payment_status !== "verified") {
        const { data: checkout, error: checkoutError } = await supabase.functions.invoke("create-plan-paypal-invoice", { body: { request_id: row.id } });
        if (checkoutError) throw new Error(await getCheckoutError(checkoutError));
        if (checkout?.error) throw new Error(checkout.error);
        setPaypalStatus(checkout?.invoice_status ?? "");
        setRequest({ ...row, paypal_invoice_id: checkout?.invoice_id ?? row.paypal_invoice_id, paypal_invoice_url: checkout?.invoice_url ?? row.paypal_invoice_url, payment_status: row.payment_status === "not_submitted" ? "submitted" : row.payment_status });
      }
    } catch (e) { setError(e instanceof Error ? e.message : getErrorMessage(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const isConfirmed = request?.status === "approved" && request.payment_status === "verified";
  const isRejected = request?.status === "rejected" || request?.payment_status === "rejected";
  const isPaid = paypalStatus === "PAID" || request?.payment_status === "paid";

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/member/plans")} accessibilityLabel="Back to plans">
        <Ionicons name="arrow-back" size={21} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Pay with PayPal</Text>
      <View style={styles.headerSpacer} />
    </View>

    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {loading ? <View style={styles.loading}><ActivityIndicator color={COLORS.blue} /><Text style={styles.muted}>Preparing secure PayPal checkout…</Text></View> : null}
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {request ? <>
        <Text style={styles.eyebrow}>STAYFIT GYM</Text>
        <Text style={styles.title}>{isConfirmed ? "Membership confirmed" : isRejected ? "Request declined" : "Complete payment"}</Text>
        <Text style={styles.subtitle}>{isConfirmed ? "Your plan is active and ready to use." : isRejected ? "Contact gym staff if you need help with this request." : "Continue to PayPal’s secure checkout and sign in there to pay. The admin will verify the payment and confirm your membership."}</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}><View><Text style={styles.label}>SELECTED PLAN</Text><Text style={styles.planName}>{request.plan_name}</Text></View><Ionicons name="logo-paypal" size={24} color="#79AFFF" /></View>
          <View style={styles.divider} />
          <View style={styles.amountRow}><Text style={styles.muted}>Amount due</Text><Text style={styles.amount}>₱{Number(request.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text></View>
          <Text style={styles.muted}>Billed per {request.billing_period} · PayPal Sandbox</Text>
        </View>

        {isConfirmed ? <View style={styles.success}><Ionicons name="checkmark-circle" size={22} color={COLORS.green} /><Text style={styles.successText}>PayPal payment verified. Your {request.plan_name} membership is active.</Text></View> : null}
        {isRejected ? <View style={styles.error}><Text style={styles.errorText}>This request was declined. Contact gym staff for assistance.</Text></View> : null}

        {!isConfirmed && !isRejected && request.status === "pending" ? <>
          <View style={styles.paymentCard}>
            <View style={styles.paymentIcon}><Ionicons name={isPaid ? "checkmark-circle" : "lock-closed"} size={26} color={isPaid ? COLORS.green : COLORS.blue} /></View>
            <Text style={styles.qrTitle}>{isPaid ? "Payment received by PayPal" : "Pay securely with PayPal"}</Text>
            <Text style={styles.qrCaption}>{isPaid ? "Your payment is waiting for admin confirmation." : "The PayPal-hosted checkout will ask you to sign in and choose a payment method."}</Text>
            {request.paypal_invoice_id ? <Text style={styles.invoiceId}>Invoice {request.paypal_invoice_id}</Text> : null}
          </View>
          {request.paypal_invoice_url ? <TouchableOpacity style={styles.openButton} onPress={() => void WebBrowser.openBrowserAsync(request.paypal_invoice_url!)}><Ionicons name="logo-paypal" size={18} color={COLORS.text} /><Text style={styles.openButtonText}>CONTINUE TO PAYPAL</Text></TouchableOpacity> : <View style={styles.error}><Text style={styles.errorText}>PayPal checkout link is not available yet. Refresh this page to try again.</Text></View>}
          <TouchableOpacity style={[styles.refreshButton, refreshing && styles.disabled]} disabled={refreshing || loading} onPress={() => { setRefreshing(true); void load(false); }}>
            {refreshing ? <ActivityIndicator color={COLORS.blue} /> : <><Ionicons name="refresh" size={16} color={COLORS.blue} /><Text style={styles.refreshText}>REFRESH PAYMENT STATUS</Text></>}
          </TouchableOpacity>
          <View style={styles.info}><Ionicons name="shield-checkmark-outline" size={18} color={COLORS.blue} /><Text style={styles.infoText}>Your payment is handled on PayPal. Your membership only activates after PayPal confirms payment and the admin approves the plan.</Text></View>
        </> : null}
      </> : null}

      <TouchableOpacity style={styles.backToMember} onPress={() => router.replace(isConfirmed ? "/member/membership" : "/member/plans")}>
        <Text style={styles.backToMemberText}>{isConfirmed ? "VIEW MEMBERSHIP" : "BACK TO PLANS"}</Text>
      </TouchableOpacity>
    </ScrollView>
    <View style={styles.bottomLine} />
  </SafeAreaView>;
}

const COLORS = { background: "#06111C", panel: "#102131", panelDeep: "#0B1A28", border: "#1C3040", borderBright: "#1D3A55", blue: "#4D8DFF", blueStrong: "#1769FF", text: "#FFFFFF", muted: "#98A2B3", dim: "#667085", green: "#54D98C", red: "#FF8585" };

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  backButton: { width: 34, height: 34, justifyContent: "center" },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  headerSpacer: { width: 34 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 28 },
  loading: { padding: 30, alignItems: "center", gap: 10 },
  eyebrow: { color: COLORS.blue, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 5 },
  title: { color: COLORS.text, fontSize: 25, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 18 },
  summaryCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.borderBright, borderRadius: 15, padding: 16, marginBottom: 17 },
  summaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: COLORS.muted, fontSize: 9, letterSpacing: 0.8, fontWeight: "800", marginBottom: 6 },
  planName: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  amount: { color: COLORS.text, fontSize: 19, fontWeight: "800" },
  muted: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  paymentCard: { alignItems: "center", backgroundColor: COLORS.panel, borderColor: COLORS.borderBright, borderWidth: 1, borderRadius: 15, padding: 22, marginBottom: 12 },
  paymentIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.panelDeep, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  qrTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", textAlign: "center" },
  qrCaption: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 6 },
  invoiceId: { color: COLORS.dim, fontSize: 9, marginTop: 8 },
  openButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.blueStrong, borderRadius: 10, marginBottom: 9 },
  openButtonText: { color: COLORS.text, fontSize: 10, fontWeight: "800" },
  refreshButton: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginBottom: 12 },
  refreshText: { color: COLORS.blue, fontSize: 9, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  info: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, backgroundColor: COLORS.panelDeep, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  infoText: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 15 },
  success: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#123D2A", borderRadius: 11, padding: 13, marginBottom: 16 },
  successText: { flex: 1, color: COLORS.text, fontSize: 12, lineHeight: 17 },
  error: { backgroundColor: "#351B25", borderRadius: 10, padding: 11, marginBottom: 14 },
  errorText: { color: COLORS.red, fontSize: 11, lineHeight: 16 },
  backToMember: { minHeight: 43, borderWidth: 1, borderColor: COLORS.borderBright, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 10 },
  backToMemberText: { color: COLORS.blue, fontSize: 10, fontWeight: "800" },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
