import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { currentUserId, getErrorMessage } from "../../lib/member-data";
import { supabase } from "../../lib/supabase";

type PlanCategory = "all" | "membership" | "daily";

const plans = [
  {
    name: "Premium Monthly",
    price: 1999,
    period: "month",
    category: "membership" as const,
    popular: true,
    benefits: ["Unlimited Gym Access", "Free Group Classes", "Trainer Session", "Priority Booking"],
  },
  {
    name: "Standard Monthly",
    price: 1299,
    period: "month",
    category: "membership" as const,
    popular: false,
    benefits: ["Unlimited Gym Access", "Free Group Class", "Locker Included"],
  },
  {
    name: "Daily Pass",
    price: 150,
    period: "day",
    category: "daily" as const,
    popular: false,
    benefits: ["Gym Access for 1 Day", "No Commitment"],
  },
];

const categories: { key: PlanCategory; label: string }[] = [
  { key: "all", label: "All Plans" },
  { key: "membership", label: "Membership" },
  { key: "daily", label: "Daily Pass" },
];

export default function MembershipPlans() {
  useThemeMode();
  const params = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState<PlanCategory>(params.category === "daily" ? "daily" : "all");
  const [busyPlan, setBusyPlan] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const visiblePlans = useMemo(() => plans.filter((plan) => category === "all" || plan.category === category), [category]);

  async function selectPlan(plan: (typeof plans)[number]) {
    setNotice("");
    setError("");
    if (plan.category === "daily") {
      router.push("/member/daily-pass");
      return;
    }

    setBusyPlan(plan.name);
    try {
      const userId = await currentUserId();
      const { data: existing, error: lookupError } = await supabase
        .from("membership_plan_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) {
        router.push({ pathname: "/member/plan-payment", params: { id: existing.id } });
        return;
      }
      const { data: request, error: insertError } = await supabase.from("membership_plan_requests").insert({
        user_id: userId,
        plan_name: plan.name,
        amount: plan.price,
        billing_period: plan.period,
      }).select("id").single();
      if (insertError) throw insertError;
      router.push({ pathname: "/member/plan-payment", params: { id: request.id } });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyPlan("");
    }
  }

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/member/membership")} accessibilityLabel="Back to membership">
        <Ionicons name="arrow-back" size={21} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Membership Plans</Text>
      <View style={styles.headerSpacer} />
    </View>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.tabs}>
        {categories.map((item) => <TouchableOpacity key={item.key} style={[styles.tab, category === item.key && styles.tabActive]} onPress={() => setCategory(item.key)}>
          <Text style={[styles.tabText, category === item.key && styles.tabTextActive]}>{item.label}</Text>
        </TouchableOpacity>)}
      </View>

      {notice ? <View style={styles.notice}><Ionicons name="checkmark-circle" size={18} color={COLORS.green} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

      {visiblePlans.map((plan) => <View key={plan.name} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
        {plan.popular ? <View style={styles.popularBadge}><Text style={styles.popularText}>MOST POPULAR</Text></View> : null}
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.price}>₱{plan.price.toLocaleString("en-PH")} <Text style={styles.period}>/ {plan.period}</Text></Text>
        <View style={styles.benefits}>{plan.benefits.map((benefit) => <View key={benefit} style={styles.benefitRow}>
          <Ionicons name="checkmark" size={13} color={COLORS.muted} />
          <Text style={styles.benefit}>{benefit}</Text>
        </View>)}</View>
        <TouchableOpacity style={[styles.selectButton, busyPlan === plan.name && styles.selectButtonBusy]} onPress={() => void selectPlan(plan)} disabled={!!busyPlan}>
          {busyPlan === plan.name ? <ActivityIndicator color={COLORS.text} size="small" /> : <Text style={styles.selectButtonText}>{plan.category === "daily" ? "SELECT PASS" : "SELECT PLAN"}</Text>}
        </TouchableOpacity>
      </View>)}

      <Text style={styles.footerNote}>Membership requests are reviewed by gym staff. Payment is confirmed separately before your membership is activated.</Text>
      <View style={{ height: 20 }} />
    </ScrollView>
    <View style={styles.bottomLine} />
  </SafeAreaView>;
}

const COLORS = { background: "#06111C", panel: "#102131", border: "#1C3040", borderBright: "#1D3A55", blue: "#1769FF", text: "#FFFFFF", muted: "#98A2B3", green: "#54D98C", red: "#FF8585" };

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  backButton: { width: 34, height: 34, justifyContent: "center" },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  headerSpacer: { width: 34 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tab: { flex: 1, minHeight: 39, borderRadius: 22, backgroundColor: COLORS.panel, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  tabActive: { backgroundColor: COLORS.blue },
  tabText: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  tabTextActive: { color: COLORS.text },
  planCard: { minHeight: 150, backgroundColor: COLORS.panel, borderRadius: 17, borderWidth: 1, borderColor: COLORS.borderBright, padding: 13, marginBottom: 32, justifyContent: "center" },
  planCardPopular: { borderColor: COLORS.blue, marginTop: 52 },
  popularBadge: { alignSelf: "flex-start", position: "absolute", top: -46, left: 0, backgroundColor: COLORS.blue, borderRadius: 18, paddingVertical: 7, paddingHorizontal: 13 },
  popularText: { color: COLORS.text, fontSize: 10, fontWeight: "800" },
  planName: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginBottom: 7 },
  price: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginBottom: 13 },
  period: { fontSize: 13, fontWeight: "700" },
  benefits: { gap: 4, paddingRight: 115 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  benefit: { color: COLORS.muted, fontSize: 10 },
  selectButton: { position: "absolute", right: 12, bottom: 16, minHeight: 42, minWidth: 116, paddingHorizontal: 10, backgroundColor: COLORS.blue, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  selectButtonBusy: { opacity: 0.7 },
  selectButtonText: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#123D2A", borderRadius: 10, padding: 11, marginBottom: 14 },
  noticeText: { flex: 1, color: COLORS.text, fontSize: 11, lineHeight: 16 },
  error: { backgroundColor: "#351B25", borderRadius: 10, padding: 11, marginBottom: 14 },
  errorText: { color: COLORS.red, fontSize: 11, lineHeight: 16 },
  footerNote: { color: COLORS.muted, fontSize: 10, lineHeight: 16, textAlign: "center", paddingHorizontal: 8, marginTop: -10 },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
