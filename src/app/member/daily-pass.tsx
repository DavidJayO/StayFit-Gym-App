
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, loadProfile, getErrorMessage } from "../../lib/member-data";

const BLUE = "#1769FF";

export default function DailyPass() {
  const [visitDate, setVisitDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; });
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [fullName, setFullName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [latestRequest, setLatestRequest] = useState("");

  useEffect(() => { void (async () => {
    try {
      const [profile, userId] = await Promise.all([loadProfile(), currentUserId()]);
      setFullName(profile.full_name);
      const { data, error } = await supabase.from("daily_pass_requests").select("status,visit_on").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data) setLatestRequest(`Latest request: ${data.status.toUpperCase()} · visit ${data.visit_on}`);
    } catch (e) { Alert.alert("Member data unavailable", getErrorMessage(e)); }
  })(); }, []);

  const handlePurchase = async () => {
    if (!visitDate.trim()) {
      Alert.alert("Required Fields", "Please enter your visit date.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
      Alert.alert("Invalid Date", "Use the YYYY-MM-DD date format.");
      return;
    }

    const selected = new Date(`${visitDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selected.getTime()) || selected < today) {
      Alert.alert("Invalid Date", "Choose today or a future visit date.");
      return;
    }

    try {
      const userId = await currentUserId();
      const { error } = await supabase.from("daily_pass_requests").insert({ user_id: userId, visit_on: visitDate, payment_method: paymentMethod === "Cash at Gym" ? "Cash" : paymentMethod });
      if (error) throw error;
      setSubmitted(true);
      setLatestRequest(`Latest request: PENDING · visit ${visitDate}`);
      Alert.alert("Request submitted", "Your daily pass request is saved. Payment and entry must be confirmed by gym staff.");
    } catch (e) { Alert.alert("Request failed", getErrorMessage(e)); }
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

        <Text style={styles.headerTitle}>Daily Pass</Text>

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
        <Text style={styles.title}>Day Pass</Text>
        <Text style={styles.subtitle}>
          Enjoy a full day of training without a monthly membership.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="fitness-outline" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.planLabel}>SINGLE-DAY ACCESS</Text>
          <Text style={styles.price}>₱250<Text style={styles.priceDecimal}>.00</Text></Text>
          <Text style={styles.priceCaption}>One-day gym visit · ₱250.00</Text>

          <View style={styles.heroDivider} />

          {[
            "Access to gym facilities for one day",
            "Use of standard workout equipment",
            "Staff assistance during your visit",
          ].map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#54D98C"
              />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#4D8DFF"
          />
          <Text style={styles.noticeText}>
            Submitting saves a request for gym staff. This does not charge your payment method or activate entry automatically.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Pass Details</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>ACCOUNT</Text>
          <Text style={styles.input}>{fullName || "Loading member profile…"}</Text>

          <Text style={styles.label}>VISIT DATE (YYYY-MM-DD)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={18} color="#98A2B3" />
            <TextInput
              style={styles.input}
              value={visitDate}
              onChangeText={setVisitDate}
            placeholder="YYYY-MM-DD"
              placeholderTextColor="#667085"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>PAYMENT METHOD</Text>

          {[
            { name: "GCash", icon: "phone-portrait-outline" as const },
                { name: "Cash", icon: "cash-outline" as const },
          ].map((method) => {
            const active = paymentMethod === method.name;

            return (
              <TouchableOpacity
                key={method.name}
                style={[
                  styles.paymentOption,
                  active && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod(method.name)}
              >
                <View style={styles.paymentIcon}>
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color="#4D8DFF"
                  />
                </View>
                <Text style={styles.paymentName}>{method.name}</Text>
                <View style={styles.radioOuter}>
                  {active && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>₱250.00</Text>
          </View>

          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={19} color="#FFFFFF" />
            <Text style={styles.purchaseButtonText}>
              {submitted ? "SUBMIT ANOTHER REQUEST" : "REQUEST DAILY PASS"}
            </Text>
          </TouchableOpacity>

          {(submitted || latestRequest) && (
            <View style={styles.pendingNotice}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#F0B45A"
              />
              <Text style={styles.pendingText}>
                {latestRequest || "Your request is saved and is awaiting staff review."}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.membershipLink}
          onPress={() => router.push("/member/membership")}
        >
          <Ionicons name="card-outline" size={19} color="#4D8DFF" />
          <Text style={styles.membershipLinkText}>
            Explore Membership Plans Instead
          </Text>
          <Ionicons name="chevron-forward" size={19} color="#98A2B3" />
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
          icon="qr-code-outline"
          label="Access"
          onPress={() => router.push("/member/access")}
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
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={21} color="#98A2B3" />
      <Text style={styles.navLabel}>{label}</Text>
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
  subtitle: { color: "#98A2B3", fontSize: 12, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  heroCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1D3A55", borderRadius: 18,
    padding: 20, marginBottom: 15,
  },
  heroIcon: {
    width: 55, height: 55, borderRadius: 15,
    backgroundColor: "#1769FF", alignItems: "center",
    justifyContent: "center", marginBottom: 17,
  },
  planLabel: {
    color: "#4D8DFF", fontSize: 10,
    fontWeight: "800", letterSpacing: 1.4,
  },
  price: { color: "#FFFFFF", fontSize: 35, fontWeight: "800", marginTop: 6 },
  priceDecimal: { fontSize: 22 },
  priceCaption: { color: "#98A2B3", fontSize: 11, marginTop: 5 },
  heroDivider: { height: 1, backgroundColor: "#24394A", marginVertical: 18 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 13 },
  benefitText: { color: "#D0D5DD", fontSize: 11, flex: 1 },
  noticeCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 9,
    backgroundColor: "#0B1A28", borderRadius: 12,
    padding: 13, marginBottom: 25,
  },
  noticeText: { color: "#98A2B3", fontSize: 10, lineHeight: 17, flex: 1 },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 13 },
  formCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 16, padding: 16,
  },
  label: {
    color: "#98A2B3", fontSize: 10, fontWeight: "700",
    letterSpacing: 0.8, marginBottom: 9, marginTop: 7,
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#0B1A28", borderWidth: 1,
    borderColor: "#24394A", borderRadius: 10,
    height: 48, paddingHorizontal: 12, marginBottom: 16,
  },
  input: { flex: 1, color: "#FFFFFF", fontSize: 12 },
  paymentOption: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0B1A28", borderWidth: 1,
    borderColor: "#24394A", borderRadius: 11,
    padding: 11, marginBottom: 10,
  },
  paymentOptionActive: { borderColor: "#1769FF", backgroundColor: "#102742" },
  paymentIcon: {
    width: 37, height: 37, borderRadius: 9,
    backgroundColor: "#142C4A", alignItems: "center",
    justifyContent: "center", marginRight: 10,
  },
  paymentName: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", flex: 1 },
  radioOuter: {
    width: 19, height: 19, borderRadius: 10,
    borderWidth: 2, borderColor: "#4D8DFF",
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#4D8DFF" },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderTopWidth: 1,
    borderTopColor: "#24394A", paddingTop: 17, marginTop: 8,
  },
  totalLabel: { color: "#D0D5DD", fontSize: 12 },
  totalPrice: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  purchaseButton: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9, backgroundColor: BLUE,
    height: 48, borderRadius: 10, marginTop: 20,
  },
  purchaseButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  pendingNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#332C1F", borderRadius: 9, padding: 11, marginTop: 13,
  },
  pendingText: { flex: 1, color: "#F0B45A", fontSize: 10, lineHeight: 16 },
  membershipLink: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 12,
    padding: 15, marginTop: 16,
  },
  membershipLinkText: { flex: 1, color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
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
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
