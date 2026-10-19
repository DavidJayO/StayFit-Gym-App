import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminColors as C } from "../../components/admin-ui";
import { errorMessage, requireAdmin } from "../../lib/admin-data";
import { supabase } from "../../lib/supabase";

export default function AdminSettings() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      try { await requireAdmin(); const { data } = await supabase.auth.getUser(); setEmail(data.user?.email ?? ""); }
      catch (e) { setError(errorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, []);
  async function logout() {
    try { const { error: signOutError } = await supabase.auth.signOut(); if (signOutError) throw signOutError; router.replace("/"); }
    catch (e) { Alert.alert("Could not log out", errorMessage(e)); }
  }
  return <AdminScreen title="More">
    {loading ? <AdminLoading /> : error ? <AdminMessage>{error}</AdminMessage> : <>
      <AdminPanel style={styles.profileCard}><View style={styles.avatar}><Ionicons name="shield-checkmark" size={23} color={C.blue} /></View><Text style={styles.name}>Administrator</Text><Text style={styles.email}>{email}</Text><Text style={styles.note}>Admin access is controlled by your role in the StayFit Supabase profile.</Text></AdminPanel>
      <TouchableOpacity style={styles.link} onPress={() => router.push("/admin/requests" as never)}><View style={styles.linkIcon}><Ionicons name="file-tray-full-outline" size={19} color={C.blue} /></View><View style={{ flex: 1 }}><Text style={styles.linkTitle}>Member Requests</Text><Text style={styles.linkSub}>Review freezes, renewals, and daily passes</Text></View><Ionicons name="chevron-forward" size={17} color={C.dim} /></TouchableOpacity>
      <TouchableOpacity style={styles.logout} onPress={() => void logout()}><Ionicons name="log-out-outline" size={17} color={C.red} /><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
    </>}
  </AdminScreen>;
}

const styles = StyleSheet.create({
  profileCard: { alignItems: "center", paddingVertical: 24, marginBottom: 14 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center", marginBottom: 11 },
  name: { color: C.text, fontSize: 15, fontWeight: "800" },
  email: { color: C.muted, fontSize: 10, marginTop: 5 },
  note: { color: C.dim, fontSize: 9, textAlign: "center", lineHeight: 14, marginTop: 12, maxWidth: 260 },
  link: { minHeight: 65, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 11, flexDirection: "row", alignItems: "center", padding: 11, marginBottom: 10 },
  linkIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.panelDeep, alignItems: "center", justifyContent: "center", marginRight: 10 },
  linkTitle: { color: C.text, fontSize: 11, fontWeight: "800" },
  linkSub: { color: C.muted, fontSize: 9, marginTop: 4 },
  logout: { minHeight: 48, backgroundColor: C.panel, borderRadius: 10, borderWidth: 1, borderColor: "#442531", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12 },
  logoutText: { color: C.red, fontSize: 11, fontWeight: "800" },
});
