import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, getErrorMessage } from "../../lib/member-data";

type Notice = { id: string; title: string; body: string; created_at: string; read_at: string | null };

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const userId = await currentUserId();
      const { data, error } = await supabase.from("member_notifications").select("id,title,body,created_at,read_at").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data ?? []) as Notice[]); setError("");
    } catch (e) { setError(getErrorMessage(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const markRead = async (id: string) => {
    const { error } = await supabase.from("member_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) setError(error.message); else void load();
  };
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity>
      <Text style={styles.title}>Notifications</Text>
      <View style={{ width: 22 }} />
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      {!!error && <Text style={styles.message}>{error}</Text>}
      {items.length === 0 && !error && <Text style={styles.message}>You don’t have any notifications yet.</Text>}
      {items.map((item) => <TouchableOpacity key={item.id} style={[styles.card, !item.read_at && styles.unread]} onPress={() => !item.read_at && void markRead(item.id)}>
        <View style={styles.row}><Ionicons name={item.read_at ? "notifications-outline" : "notifications"} size={20} color="#4D8DFF" /><Text style={styles.cardTitle}>{item.title}</Text></View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        {!item.read_at && <Text style={styles.markRead}>Tap to mark as read</Text>}
      </TouchableOpacity>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111C" },
  header: { padding: 20, paddingTop: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#1C3040" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { padding: 20, gap: 12 },
  card: { backgroundColor: "#102131", borderColor: "#24394A", borderWidth: 1, borderRadius: 14, padding: 16 },
  unread: { borderColor: "#1769FF" },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  cardTitle: { flex: 1, color: "#fff", fontWeight: "700" },
  body: { color: "#D0D5DD", marginTop: 10, lineHeight: 19 },
  date: { color: "#98A2B3", fontSize: 11, marginTop: 12 },
  markRead: { color: "#4D8DFF", fontSize: 11, marginTop: 8 },
  message: { color: "#98A2B3", lineHeight: 20 },
});
