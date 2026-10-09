import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const BLUE = "#1769FF";
const durations = [7, 14, 30];

export default function FreezeScreen() {
  const [duration, setDuration] = useState(7);
  const [reason, setReason] = useState("");

  const submitRequest = () => {
    if (!reason.trim()) {
      Alert.alert("Reason Required", "Please enter a reason for freezing your membership.");
      return;
    }

    Alert.alert(
      "Submit Freeze Request",
      `Request a ${duration}-day membership freeze?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () =>
            Alert.alert(
              "Request Submitted",
              "This is a demo request. It has not been saved or sent to the administrator."
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/member/profile")}>
          <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
          <Text style={styles.backText}>Back to Profile</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Membership Freeze</Text>
        <Text style={styles.subtitle}>
          Request a temporary pause in your membership.
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="snow-outline" size={26} color="#4D8DFF" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.planName}>Premium Plan</Text>
            <Text style={styles.muted}>Current membership</Text>
          </View>
          <View style={styles.status}>
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Freeze Duration</Text>
        <View style={styles.durationRow}>
          {durations.map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.durationCard,
                duration === days && styles.selectedDuration,
              ]}
              onPress={() => setDuration(days)}
            >
              <Text
                style={[
                  styles.durationNumber,
                  duration === days && styles.selectedText,
                ]}
              >
                {days}
              </Text>
              <Text
                style={[
                  styles.durationLabel,
                  duration === days && styles.selectedText,
                ]}
              >
                {days === 1 ? "Day" : "Days"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Reason for Freeze</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Enter your reason..."
          placeholderTextColor="#64748B"
          multiline
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={styles.counter}>{reason.length}/300</Text>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={22} color="#4D8DFF" />
          <Text style={styles.noticeText}>
            Your request requires administrator approval. Your membership will
            remain active until the request is approved.
          </Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={submitRequest}>
          <Text style={styles.buttonText}>Submit Freeze Request</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  content: { padding: 20, paddingTop: 48, paddingBottom: 30 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 },
  backText: { color: "#D0D5DD", fontSize: 13 },
  header: { color: "#FFFFFF", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#98A2B3", fontSize: 13, marginTop: 6, marginBottom: 24, lineHeight: 19 },
  statusCard: {
    backgroundColor: "#102131",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#1D3A55",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0B1A28",
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: { flex: 1 },
  planName: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  muted: { color: "#98A2B3", fontSize: 11, marginTop: 4 },
  status: { backgroundColor: "#123D2A", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: "#54D98C", fontSize: 9, fontWeight: "700" },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 25, marginBottom: 12 },
  durationRow: { flexDirection: "row", gap: 12 },
  durationCard: {
    flex: 1,
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#24394A",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 18,
  },
  selectedDuration: { backgroundColor: "#122D50", borderColor: BLUE },
  durationNumber: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  durationLabel: { color: "#98A2B3", fontSize: 12, marginTop: 4 },
  selectedText: { color: "#4D8DFF" },
  input: {
    minHeight: 115,
    backgroundColor: "#0B1A28",
    borderColor: "#24394A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 13,
  },
  counter: { color: "#64748B", fontSize: 10, textAlign: "right", marginTop: 6 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#102131",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  noticeText: { color: "#D0D5DD", fontSize: 12, flex: 1, lineHeight: 18 },
  submitButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    padding: 16,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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