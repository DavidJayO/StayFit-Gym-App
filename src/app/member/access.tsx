
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Access() {
  const showDemoNotice = () => {
    Alert.alert(
      "Demo Access Pass",
      "This is a preview only. A real QR code must be generated and validated by the gym's backend before it can be used for entry."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.replace("/member/dashboard")}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Gym Access</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/member/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>STAYFIT GYM</Text>
        <Text style={styles.title}>Your Access Pass</Text>
        <Text style={styles.subtitle}>
          Your membership, ready for your next workout.
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={25}
              color="#54D98C"
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Membership Active</Text>
            <Text style={styles.statusSubtitle}>
              Premium Plan • Valid until Dec 31, 2026
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.passCard}>
          <View style={styles.passHeader}>
            <View style={styles.logoIcon}>
              <Ionicons name="fitness" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.passHeaderText}>
              <Text style={styles.gymName}>STAYFIT GYM</Text>
              <Text style={styles.passType}>MEMBER ACCESS PASS</Text>
            </View>
            <Ionicons name="shield-checkmark" size={23} color="#4D8DFF" />
          </View>

          <View style={styles.passDivider} />

          <View style={styles.memberInfo}>
            <Text style={styles.memberLabel}>MEMBER NAME</Text>
            <Text style={styles.memberName}>David Jay Ongcoy</Text>
            <Text style={styles.memberId}>MEMBER ID: SF-DEMO-001</Text>
          </View>

          <TouchableOpacity
            style={styles.qrContainer}
            onPress={showDemoNotice}
            activeOpacity={0.85}
          >
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={112} color="#1769FF" />
            </View>
            <Text style={styles.qrTitle}>DEMO ACCESS PASS</Text>
            <Text style={styles.qrSubtitle}>
              Tap to view access information
            </Text>
          </TouchableOpacity>

          <View style={styles.passFooter}>
            <View>
              <Text style={styles.memberLabel}>MEMBERSHIP</Text>
              <Text style={styles.passFooterValue}>Premium</Text>
            </View>
            <View style={styles.passFooterRight}>
              <Text style={styles.memberLabel}>STATUS</Text>
              <Text style={styles.passFooterStatus}>ACTIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#4D8DFF"
          />
          <View style={styles.noticeInfo}>
            <Text style={styles.noticeTitle}>How to access the gym</Text>
            <Text style={styles.noticeText}>
              Show your valid access pass to authorized gym personnel.
              Follow their instructions for entry verification.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.membershipButton}
          onPress={() => router.push("/member/membership")}
        >
          <Ionicons name="card-outline" size={19} color="#4D8DFF" />
          <Text style={styles.membershipButtonText}>
            View Membership Details
          </Text>
          <Ionicons
            name="chevron-forward"
            size={19}
            color="#98A2B3"
          />
        </TouchableOpacity>

        <Text style={styles.footer}>
          STAYFIT GYM • MEMBERSHIP • FITNESS • COMMUNITY
        </Text>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem
          icon="home-outline"
          label="Home"
          onPress={() => router.replace("/member/dashboard")}
        />
        <NavItem
          icon="barbell-outline"
          label="Classes"
          onPress={() => router.push("/member/classes")}
        />
        <NavItem
          icon="qr-code"
          label="Access"
          active
          onPress={() => {}}
        />
        <NavItem
          icon="card-outline"
          label="Membership"
          onPress={() => router.push("/member/membership")}
        />
        <NavItem
          icon="person-outline"
          label="Profile"
          onPress={() => router.replace("/member/profile")}
        />
      </View>

      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={icon}
        size={21}
        color={active ? "#4D8DFF" : "#98A2B3"}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111C" },
  header: {
    height: 54, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 18,
  },
  headerButton: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "#102131", alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 25 },
  eyebrow: {
    color: "#4D8DFF", fontSize: 10, fontWeight: "800",
    letterSpacing: 2, marginBottom: 7,
  },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "800" },
  subtitle: { color: "#98A2B3", fontSize: 12, marginTop: 6, marginBottom: 20 },
  statusCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 15,
    padding: 13, marginBottom: 20,
  },
  statusIcon: {
    width: 43, height: 43, borderRadius: 12,
    backgroundColor: "#123D2A", alignItems: "center",
    justifyContent: "center", marginRight: 10,
  },
  statusInfo: { flex: 1 },
  statusTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  statusSubtitle: { color: "#98A2B3", fontSize: 9, marginTop: 5 },
  activeBadge: {
    backgroundColor: "#123D2A", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  activeText: { color: "#54D98C", fontSize: 9, fontWeight: "800" },
  passCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#24394A", borderRadius: 19,
    padding: 18, marginBottom: 17,
  },
  passHeader: { flexDirection: "row", alignItems: "center" },
  logoIcon: {
    width: 43, height: 43, borderRadius: 12,
    backgroundColor: "#1769FF", alignItems: "center",
    justifyContent: "center", marginRight: 11,
  },
  passHeaderText: { flex: 1 },
  gymName: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  passType: { color: "#98A2B3", fontSize: 9, marginTop: 5, letterSpacing: 0.7 },
  passDivider: { height: 1, backgroundColor: "#24394A", marginVertical: 17 },
  memberInfo: { marginBottom: 17 },
  memberLabel: {
    color: "#98A2B3", fontSize: 9,
    fontWeight: "700", letterSpacing: 1,
  },
  memberName: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 7 },
  memberId: { color: "#4D8DFF", fontSize: 10, marginTop: 6, letterSpacing: 0.5 },
  qrContainer: {
    backgroundColor: "#FFFFFF", borderRadius: 14,
    alignItems: "center", padding: 17,
  },
  qrPlaceholder: {
    width: 160, height: 160, backgroundColor: "#F2F6FC",
    borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  qrTitle: {
    color: "#1769FF", fontSize: 11,
    fontWeight: "800", letterSpacing: 1, marginTop: 13,
  },
  qrSubtitle: { color: "#667085", fontSize: 10, marginTop: 5 },
  passFooter: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: 18,
  },
  passFooterRight: { alignItems: "flex-end" },
  passFooterValue: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", marginTop: 5 },
  passFooterStatus: { color: "#54D98C", fontSize: 12, fontWeight: "800", marginTop: 5 },
  noticeCard: {
    flexDirection: "row", gap: 11, backgroundColor: "#102131",
    borderWidth: 1, borderColor: "#1C3040",
    borderRadius: 13, padding: 14, marginBottom: 14,
  },
  noticeInfo: { flex: 1 },
  noticeTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  noticeText: { color: "#98A2B3", fontSize: 11, lineHeight: 18, marginTop: 6 },
  membershipButton: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 12, padding: 15,
  },
  membershipButtonText: { flex: 1, color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  footer: {
    color: "#667085", fontSize: 9, textAlign: "center",
    marginTop: 25, letterSpacing: 0.5,
  },
  bottomNav: {
    height: 65, flexDirection: "row", backgroundColor: "#0B1A28",
    borderTopWidth: 1, borderTopColor: "#1C3040",
    justifyContent: "space-around", alignItems: "center", paddingHorizontal: 4,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: "#98A2B3", fontSize: 9 },
  navLabelActive: { color: "#4D8DFF", fontWeight: "700" },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
