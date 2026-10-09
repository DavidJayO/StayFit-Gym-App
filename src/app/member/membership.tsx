import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BLUE = "#1769FF";

const benefits = [
  "Unlimited gym access",
  "Free group fitness classes",
  "Access to gym equipment",
  "Monthly fitness assessment",
  "Member-only rewards",
];

export default function MembershipScreen() {
  const renewMembership = () => {
    Alert.alert(
      "Renew Membership",
      "Your renewal request will be processed by the gym administrator.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            Alert.alert("Demo Only", "Membership renewal is not connected to a backend yet."),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>My Membership</Text>
        <Text style={styles.subtitle}>Manage your gym membership</Text>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.label}>CURRENT PLAN</Text>
              <Text style={styles.planName}>Premium Plan</Text>
            </View>
            <View style={styles.status}>
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>

          <Text style={styles.price}>₱12,000</Text>
          <Text style={styles.muted}>12-month membership</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.muted}>Start Date</Text>
            <Text style={styles.detail}>Jan 01, 2026</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.muted}>Expiration Date</Text>
            <Text style={styles.detail}>Dec 31, 2026</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.muted}>Renewal</Text>
            <Text style={styles.detail}>Manual</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Membership Benefits</Text>

        <View style={styles.card}>
          {benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color="#54D98C" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

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

const styles = StyleSheet.create({
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