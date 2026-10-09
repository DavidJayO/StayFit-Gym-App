import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BLUE = "#1769FF";

const payments = [
  {
    id: "PAY-001",
    title: "Premium Membership",
    date: "Oct 01, 2026",
    amount: "₱12,000.00",
    status: "Paid",
    method: "GCash",
  },
  {
    id: "PAY-002",
    title: "Group Fitness Class",
    date: "Sep 18, 2026",
    amount: "₱250.00",
    status: "Paid",
    method: "Cash",
  },
  {
    id: "PAY-003",
    title: "Daily Gym Pass",
    date: "Sep 10, 2026",
    amount: "₱250.00",
    status: "Pending",
    method: "GCash",
  },
];

export default function PaymentsScreen() {
  const [method, setMethod] = useState("GCash");

  const handlePayment = () => {
    Alert.alert(
      "Payment Method",
      `Selected method: ${method}\n\nThis is a demo. No actual payment will be processed.`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Payments</Text>
        <Text style={styles.subtitle}>
          Manage your payments and transaction history.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="wallet-outline" size={25} color="#4D8DFF" />
          </View>
          <Text style={styles.summaryLabel}>Membership Plan</Text>
          <Text style={styles.summaryAmount}>₱12,000.00</Text>
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#54D98C" />
            <Text style={styles.paidText}>Paid</Text>
          </View>
          <Text style={styles.summaryNote}>Premium Plan • 2026</Text>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>

        <View style={styles.methodRow}>
          {[
            { name: "GCash", icon: "phone-portrait-outline" },
            { name: "Cash", icon: "cash-outline" },
          ].map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.methodCard,
                method === item.name && styles.selectedMethod,
              ]}
              onPress={() => setMethod(item.name)}
            >
              <Ionicons
                name={item.icon as any}
                size={23}
                color={method === item.name ? "#4D8DFF" : "#98A2B3"}
              />
              <Text
                style={[
                  styles.methodText,
                  method === item.name && styles.selectedText,
                ]}
              >
                {item.name}
              </Text>
              {method === item.name && (
                <Ionicons name="checkmark-circle" size={17} color="#4D8DFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Ionicons name="card-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Continue to Payment</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Transaction History</Text>

        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentTop}>
              <View style={styles.paymentIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={22}
                  color="#4D8DFF"
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{payment.title}</Text>
                <Text style={styles.paymentDate}>{payment.date}</Text>
                <Text style={styles.paymentMethod}>
                  {payment.method} • {payment.id}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  payment.status === "Paid"
                    ? styles.paidStatus
                    : styles.pendingStatus,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    payment.status === "Paid"
                      ? styles.paidStatusText
                      : styles.pendingStatusText,
                  ]}
                >
                  {payment.status}
                </Text>
              </View>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amount}>{payment.amount}</Text>
            </View>
          </View>
        ))}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#4D8DFF"
          />
          <Text style={styles.noticeText}>
            Payment records shown are sample data. Verify payments with the
            gym administrator before marking a transaction as paid.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/member/membership")}
        >
          <Ionicons name="card-outline" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>View Membership</Text>
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
          {
            label: "Membership",
            icon: "card-outline",
            path: "/member/membership",
          },
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
              color={item.label === "Profile" ? "#4D8DFF" : "#98A2B3"}
            />
            <Text
              style={[
                styles.navText,
                item.label === "Profile" && styles.activeNavText,
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
  content: { padding: 20, paddingTop: 50, paddingBottom: 30 },
  header: { color: "#FFFFFF", fontSize: 25, fontWeight: "700" },
  subtitle: {
    color: "#98A2B3",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 23,
  },
  summaryCard: {
    backgroundColor: "#102131",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1D3A55",
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0B1A28",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  summaryLabel: { color: "#98A2B3", fontSize: 12 },
  summaryAmount: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 5,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#123D2A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
  },
  paidText: { color: "#54D98C", fontSize: 11, fontWeight: "700" },
  summaryNote: { color: "#98A2B3", fontSize: 11, marginTop: 12 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 13,
  },
  methodRow: { flexDirection: "row", gap: 12 },
  methodCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#24394A",
    borderRadius: 12,
    padding: 15,
  },
  selectedMethod: { borderColor: BLUE, backgroundColor: "#122D50" },
  methodText: { color: "#D0D5DD", fontSize: 13, fontWeight: "600" },
  selectedText: { color: "#4D8DFF" },
  payButton: {
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
  },
  buttonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  paymentCard: {
    backgroundColor: "#102131",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1C3040",
  },
  paymentTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#0B1A28",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  paymentDate: { color: "#98A2B3", fontSize: 11, marginTop: 5 },
  paymentMethod: { color: "#64748B", fontSize: 10, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  paidStatus: { backgroundColor: "#123D2A" },
  pendingStatus: { backgroundColor: "#3A2D17" },
  statusText: { fontSize: 10, fontWeight: "700" },
  paidStatusText: { color: "#54D98C" },
  pendingStatusText: { color: "#F5C16C" },
  paymentDivider: { height: 1, backgroundColor: "#24394A", marginVertical: 13 },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  amountLabel: { color: "#98A2B3", fontSize: 12 },
  amount: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#102131",
    padding: 13,
    borderRadius: 12,
    marginTop: 10,
  },
  noticeText: { color: "#98A2B3", fontSize: 11, flex: 1, lineHeight: 17 },
  secondaryButton: {
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#24394A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  footer: {
    color: "#64748B",
    fontSize: 9,
    textAlign: "center",
    marginTop: 28,
    letterSpacing: 1,
  },
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