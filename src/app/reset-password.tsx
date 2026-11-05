import { createThemeStyles, getThemePalette, useThemeMode } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

function getCallbackParams(url: string) {
  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.search);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  fragment.forEach((value, key) => { if (!params.has(key)) params.set(key, value); });
  return params;
}

export default function ResetPassword() {
  const colors = getThemePalette(useThemeMode());
  const linkingUrl = Linking.useLinkingURL();
  const lastHandledUrl = useRef("");
  const [checkingLink, setCheckingLink] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function acceptRecoveryUrl(url: string | null) {
      if (!url) {
        if (mounted) setCheckingLink(false);
        return;
      }
      if (url === lastHandledUrl.current) return;
      lastHandledUrl.current = url;

      try {
        const params = getCallbackParams(url);
        const callbackError = params.get("error_description") || params.get("error");
        if (callbackError) throw new Error(callbackError);

        const type = params.get("type");
        const tokenHash = params.get("token_hash");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const authCode = params.get("code");

        if (type && type !== "recovery") throw new Error("This email link is not a password reset link.");
        if (tokenHash && type === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
          if (verifyError) throw verifyError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (sessionError) throw sessionError;
        } else if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) throw exchangeError;
        } else {
          throw new Error("This reset link is incomplete. Request a new password reset email and open the newest link.");
        }

        if (mounted) { setValidRecovery(true); setError(""); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "This reset link is invalid or expired. Request a new one.");
      } finally {
        if (mounted) setCheckingLink(false);
      }
    }

    void acceptRecoveryUrl(linkingUrl);
    return () => { mounted = false; };
  }, [linkingUrl]);

  async function savePassword() {
    setError("");
    if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("The passwords do not match."); return; }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut({ scope: "local" });
      router.replace({ pathname: "/login", params: { passwordReset: "1" } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your password. Request a new reset link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/login")} accessibilityLabel="Back to login">
        <Ionicons name="arrow-back" size={21} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.iconCircle}><Ionicons name="key-outline" size={25} color={colors.blue} /></View>
      <Text style={styles.title}>Choose a new password</Text>

      {checkingLink ? <View style={styles.loading}><ActivityIndicator color={colors.blue} /><Text style={styles.subtitle}>Checking your reset link…</Text></View> : null}
      {!checkingLink && !validRecovery ? <>
        <Text style={styles.subtitle}>Open the newest password reset link from your email. If it has expired, request another from the login page.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.submit} onPress={() => router.replace("/login")}><Text style={styles.submitText}>BACK TO LOGIN</Text></TouchableOpacity>
      </> : null}

      {validRecovery ? <>
        <Text style={styles.subtitle}>Choose a new password for your StayFit account.</Text>
        <Text style={styles.label}>New password</Text>
        <View style={styles.inputContainer}><Ionicons name="lock-closed-outline" size={17} color={colors.muted} /><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.dim} secureTextEntry autoCapitalize="none" textContentType="newPassword" /></View>
        <Text style={styles.confirmLabel}>Confirm new password</Text>
        <View style={styles.inputContainer}><Ionicons name="lock-closed-outline" size={17} color={colors.muted} /><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Enter it again" placeholderTextColor={colors.dim} secureTextEntry autoCapitalize="none" textContentType="newPassword" /></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.submit} onPress={() => void savePassword()} disabled={busy} activeOpacity={0.8}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>SAVE NEW PASSWORD</Text>}
        </TouchableOpacity>
      </> : null}
    </View>
    <View style={styles.bottomLine} />
  </SafeAreaView>;
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14, justifyContent: "center" },
  backButton: { position: "absolute", top: 14, left: 16, width: 40, height: 40, borderRadius: 10, backgroundColor: "#102131", borderWidth: 1, borderColor: "#1C3040", alignItems: "center", justifyContent: "center" },
  iconCircle: { alignSelf: "center", width: 58, height: 58, borderRadius: 18, backgroundColor: "#0B1A28", borderWidth: 1, borderColor: "#1D3A55", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { color: "#FFFFFF", textAlign: "center", fontSize: 23, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#98A2B3", textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 20 },
  loading: { alignItems: "center", paddingTop: 18 },
  label: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", marginTop: 14, marginBottom: 7 },
  confirmLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", marginTop: 16, marginBottom: 7 },
  inputContainer: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, backgroundColor: "#0B1A28", borderWidth: 1, borderColor: "#1C3040", borderRadius: 10 },
  input: { flex: 1, color: "#FFFFFF", fontSize: 13, paddingVertical: 12 },
  submit: { minHeight: 49, borderRadius: 10, backgroundColor: "#1769FF", alignItems: "center", justifyContent: "center", marginTop: 20 },
  submitText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  error: { color: "#FF8585", fontSize: 11, lineHeight: 16, marginTop: 14 },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
