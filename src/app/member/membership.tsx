import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { currentUserId, formatDate, loadMembership, Membership, getErrorMessage } from "../../lib/member-data";

const BLUE = "#1769FF";

export default function MembershipScreen() {
  useThemeMode();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void loadMembership().then(setMembership).catch((e) => setError(getErrorMessage(e))); }, []);

  const renewMembership = async () => {
    try {
      const userId = await currentUserId();
      const { error } = await supabase.from("membership_renewal_requests").insert({ user_id: userId, membership_id: membership?.id ?? null });
      if (error) throw error;
      setNotice("Renewal request submitted. The gym will contact you about payment and activation.");
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const hasMembership = !!membership;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>My Membership</Text>
        <Text style={styles.subtitle}>{hasMembership ? "Manage your gym membership" : "Choose a plan to get started"}</Text>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.label}>CURRENT PLAN</Text>
              <Text style={styles.planName}>{membership?.plan_name ?? "No membership on file"}</Text>
            </View>
            <View style={styles.status}>
              <Text style={styles.statusText}>{membership?.status?.toUpperCase() ?? "NONE"}</Text>
            </View>
          </View>

          <Text style={styles.price}>{membership?.plan_name ?? "Choose your first plan"}</Text>
          <Text style={styles.muted}>{hasMembership ? "Your membership details are synced with the gym." : "Compare the available options and send a plan request to the gym."}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.muted}>Start Date</Text>
            <Text style={styles.detail}>{formatDate(membership?.starts_on)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.muted}>Expiration Date</Text>
            <Text style={styles.detail}>{formatDate(membership?.ends_on)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.muted}>Renewal</Text>
            <Text style={styles.detail}>Manual</Text>
          </View>
        </View>

        {!!error && <Text style={styles.muted}>{error}</Text>}
        {!!notice && <Text style={styles.muted}>{notice}</Text>}
        {hasMembership ? <>
          <TouchableOpacity style={styles.primaryButton} onPress={renewMembership}>
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Renew Membership</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/member/freeze")}
          >
            <Ionicons name="snow-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Request Membership Freeze</Text>
          </TouchableOpacity>
        </> : <>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/member/plans")}>
            <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Browse Membership Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/member/plans?category=daily")}>
            <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>View Daily Pass</Text>
          </TouchableOpacity>
        </>}

        <Text style={styles.footer}>
          STAYFIT GYM • MEMBERSHIP • FITNESS • COMMUNITY
        </Text>
      </ScrollView>

      <View style={styles.bottomNav}>
        {[
          { label: "Home", icon: "home-outline", path: "/member/dashboard" },
          { label: "Classes", icon: "barbell-outline", path: "/member/classes" },
          { label: "Access", icon: "qr-code-outline", path: "/member/access" },
          { label: "Membership", icon: "card-outline", path: "/member/membership" },
          { label: "Profile", icon: "person-outline", path: "/member/profile" },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => router.replace(item.path as any)}
          >
            <Ionicons
              name={item.icon as any}
              size={21}
              color={item.label === "Membership" ? "#4D8DFF" : "#98A2B3"}
            />
            <Text
              style={[
                styles.navText,
                item.label === "Membership" && styles.activeNavText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" },
  content: { padding: 20, paddingTop: 55, paddingBottom: 30 },
  header: { color: "#FFFFFF", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#98A2B3", fontSize: 13, marginTop: 6, marginBottom: 24 },
  planCard: {
    backgroundColor: "#102131",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1D3A55",
  },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#98A2B3", fontSize: 11, letterSpacing: 1 },
  planName: { color: "#FFFFFF", fontSize: 21, fontWeight: "700", marginTop: 7 },
  status: { backgroundColor: "#123D2A", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: "#54D98C", fontSize: 10, fontWeight: "700" },
  price: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", marginTop: 22 },
  muted: { color: "#98A2B3", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#24394A", marginVertical: 18 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  detail: { color: "#D0D5DD", fontSize: 12, fontWeight: "600" },
  sectionTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginTop: 25, marginBottom: 12 },
  card: { backgroundColor: "#102131", borderRadius: 16, padding: 17, gap: 16 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { color: "#D0D5DD", fontSize: 13 },
  primaryButton: {
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: 15,
    borderRadius: 12,
    marginTop: 22,
  },
  secondaryButton: {
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#24394A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: 15,
    borderRadius: 12,
    marginTop: 11,
  },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  footer: { color: "#64748B", fontSize: 9, textAlign: "center", marginTop: 28, letterSpacing: 1 },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#0B1A28",
    borderTopWidth: 1,
    borderTopColor: "#1C3040",
    paddingTop: 10,
    paddingBottom: 18,
  },
  navItem: { flex: 1, alignItems: "center", gap: 4 },
  navText: { color: "#98A2B3", fontSize: 9 },
  activeNavText: { color: "#4D8DFF", fontWeight: "700" },
});
