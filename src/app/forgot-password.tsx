import { createThemeStyles, getThemePalette, useThemeMode } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const colors = getThemePalette(useThemeMode());
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendResetLink() {
    setError("");
    if (!email.trim()) { setError("Enter the email address for your account."); return; }
    if (!isSupabaseConfigured) { setError("Supabase is not configured. Check the app's .env settings and restart Expo."); return; }

    setBusy(true);
    try {
      // Use the current web host during browser testing, and the configured app scheme in native builds.
      const redirectTo = Platform.OS === "web"
        ? new URL("/reset-password", window.location.href).toString()
        : Linking.createURL("reset-password");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (resetError) throw resetError;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/login")} accessibilityLabel="Back to login">
        <Ionicons name="arrow-back" size={21} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.iconCircle}><Ionicons name={sent ? "mail-open-outline" : "lock-open-outline"} size={25} color={colors.blue} /></View>
      <Text style={styles.title}>{sent ? "Check your email" : "Reset your password"}</Text>
      <Text style={styles.subtitle}>{sent
        ? `We sent a password reset link to ${email.trim()}. Open it to choose a new password.`
        : "Enter the email address on your StayFit account. We’ll send you a link to choose a new password."}</Text>

      {!sent ? <>
        <Text style={styles.label}>Email address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={17} color={colors.muted} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.dim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
          />
        </View>
      </> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!sent ? <TouchableOpacity style={styles.submit} onPress={() => void sendResetLink()} disabled={busy} activeOpacity={0.8}>
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>SEND RESET LINK</Text>}
      </TouchableOpacity> : null}
      {sent ? <TouchableOpacity style={styles.submit} onPress={() => router.replace("/login")} activeOpacity={0.8}><Text style={styles.submitText}>BACK TO LOGIN</Text></TouchableOpacity> : null}
      {sent ? <TouchableOpacity style={styles.resend} onPress={() => setSent(false)}><Text style={styles.loginText}>Use a different email or resend</Text></TouchableOpacity> : null}
      {!sent ? <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/login")}><Text style={styles.loginText}>Back to login</Text></TouchableOpacity> : null}
    </View>
    <View style={styles.bottomLine} />
  </SafeAreaView>;
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14, justifyContent: "center" },
  backButton: { position: "absolute", top: 14, left: 16, width: 40, height: 40, borderRadius: 10, backgroundColor: "#102131", borderWidth: 1, borderColor: "#1C3040", alignItems: "center", justifyContent: "center" },
  iconCircle: { alignSelf: "center", width: 58, height: 58, borderRadius: 18, backgroundColor: "#0B1A28", borderWidth: 1, borderColor: "#1D3A55", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { color: "#FFFFFF", textAlign: "center", fontSize: 23, fontWeight: "800" },
  subtitle: { color: "#98A2B3", textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 28 },
  label: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", marginBottom: 7 },
  inputContainer: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, backgroundColor: "#0B1A28", borderWidth: 1, borderColor: "#1C3040", borderRadius: 10 },
  input: { flex: 1, color: "#FFFFFF", fontSize: 13, paddingVertical: 12 },
  error: { color: "#FF8585", fontSize: 11, lineHeight: 16, marginTop: 12 },
  submit: { minHeight: 49, borderRadius: 10, backgroundColor: "#1769FF", alignItems: "center", justifyContent: "center", marginTop: 20 },
  submitText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  loginLink: { alignSelf: "center", padding: 14, marginTop: 4 },
  resend: { alignSelf: "center", padding: 14 },
  loginText: { color: "#4D8DFF", fontSize: 11, fontWeight: "700" },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
