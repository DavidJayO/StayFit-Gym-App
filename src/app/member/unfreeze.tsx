import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { currentUserId, getErrorMessage, loadMembership, Membership } from "../../lib/member-data";
import { supabase } from "../../lib/supabase";

const BLUE = "#1769FF";

export default function UnfreezeScreen() {
  useThemeMode();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [currentMembership, userId] = await Promise.all([loadMembership(), currentUserId()]);
      setMembership(currentMembership);
      if (currentMembership?.status === "frozen") {
        const { data, error: requestError } = await supabase
          .from("unfreeze_requests")
          .select("id,status,created_at")
          .eq("user_id", userId)
          .eq("membership_id", currentMembership.id)
          .eq("status", "pending")
          .maybeSingle();
        if (requestError) throw requestError;
        setPending(!!data);
      } else {
        setPending(false);
      }
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (!membership || membership.status !== "frozen") throw new Error("There is no frozen membership to unfreeze.");
      const userId = await currentUserId();
      const { error: insertError } = await supabase.from("unfreeze_requests").insert({
        user_id: userId,
        membership_id: membership.id,
        reason: reason.trim(),
      });
      if (insertError) throw insertError;
      setPending(true);
      setReason("");
      setMessage("Your unfreeze request was sent to the admin for review. Your membership stays frozen until it is approved.");
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setSaving(false); }
  }

  return <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/member/membership")}>
        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        <Text style={styles.backText}>Back to Membership</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Request Membership Unfreeze</Text>
      <Text style={styles.subtitle}>Ask the gym admin to reactivate your frozen membership.</Text>

      <View style={styles.card}>
        <View style={styles.icon}><Ionicons name="snow-outline" size={23} color="#4D8DFF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.plan}>{membership?.plan_name ?? "Membership"}</Text>
          <Text style={styles.meta}>Status: {membership?.status?.toUpperCase() ?? (loading ? "LOADING" : "NOT FOUND")}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Message for the admin (optional)</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="Add a note about your request..."
        placeholderTextColor="#64748B"
        multiline
        textAlignVertical="top"
        maxLength={300}
      />
      <Text style={styles.counter}>{reason.length}/300</Text>

      {pending ? <Text style={styles.info}>Your unfreeze request is pending admin review. Your membership remains frozen until the admin approves it.</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!message ? <Text style={styles.info}>{message}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (saving || loading || pending || membership?.status !== "frozen") && styles.disabled]}
        onPress={() => void submit()}
        disabled={saving || loading || pending || membership?.status !== "frozen"}
      >
        <Text style={styles.buttonText}>{saving ? "SENDING REQUEST…" : pending ? "REQUEST PENDING" : "SUBMIT UNFREEZE REQUEST"}</Text>
        {!pending ? <Ionicons name="arrow-forward" size={17} color="#FFFFFF" /> : null}
      </TouchableOpacity>
    </ScrollView>
  </View>;
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" },
  content: { padding: 20, paddingTop: 45, paddingBottom: 35 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 },
  backText: { color: "#D0D5DD", fontSize: 12 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#98A2B3", fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 22 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 14, backgroundColor: "#102131", borderWidth: 1, borderColor: "#1D3A55" },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#0B1A28" },
  plan: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  meta: { color: "#98A2B3", fontSize: 10, marginTop: 5 },
  sectionTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 23, marginBottom: 10 },
  input: { minHeight: 105, padding: 13, backgroundColor: "#0B1A28", borderWidth: 1, borderColor: "#24394A", borderRadius: 11, color: "#FFFFFF", fontSize: 12 },
  counter: { color: "#64748B", fontSize: 9, textAlign: "right", marginTop: 5 },
  info: { color: "#C5D0DF", fontSize: 11, lineHeight: 17, marginTop: 14 },
  error: { color: "#FF8585", fontSize: 11, lineHeight: 17, marginTop: 14 },
  button: { minHeight: 48, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9, backgroundColor: BLUE, borderRadius: 11, marginTop: 20 },
  disabled: { opacity: 0.55 },
  buttonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
});
