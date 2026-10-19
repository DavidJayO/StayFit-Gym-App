import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { errorMessage, formatAdminDate, loadAdminMembers } from "../../lib/admin-data";

export default function AdminMembers() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try { setRows(await loadAdminMembers()); } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => rows.filter((row) => `${row.full_name} ${row.email} ${row.phone}`.toLowerCase().includes(search.toLowerCase().trim())), [rows, search]);
  return <AdminScreen title="Members" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.blue} />}>
    <TextInput value={search} onChangeText={setSearch} placeholder="Search name or phone" placeholderTextColor={C.dim} style={styles.search} />
    {error ? <AdminMessage>{error}</AdminMessage> : null}
    <AdminSectionTitle>{loading ? "Loading members" : `${visible.length} members`}</AdminSectionTitle>
    {loading && rows.length === 0 ? <AdminLoading /> : visible.length === 0 ? <AdminPanel><Text style={styles.muted}>No members match this search.</Text></AdminPanel> : visible.map((row) => {
      const membership = row.membership;
      const active = membership?.status === "active" && membership.ends_on >= new Date().toISOString().slice(0, 10);
      return <TouchableOpacity key={row.id} activeOpacity={0.8} style={styles.memberCard} onPress={() => router.push(`/admin/member/${row.id}` as never)}>
        <View style={styles.avatar}><Ionicons name="person" size={19} color={C.blue} /></View>
        <View style={styles.info}><Text style={styles.name}>{row.full_name || "Unnamed member"}</Text><Text style={styles.meta}>{row.email || row.phone || "No contact details"}</Text><Text style={styles.meta}>Joined {formatAdminDate(row.created_at)}</Text>{membership ? <Text style={styles.plan}>{membership.plan_name} · ends {formatAdminDate(membership.ends_on)}</Text> : <Text style={styles.meta}>No membership recorded</Text>}</View>
        <Text style={[styles.badge, active ? styles.active : styles.inactive]}>{active ? "ACTIVE" : membership?.status?.toUpperCase() ?? "NONE"}</Text>
        <Ionicons name="chevron-forward" size={15} color={C.dim} style={{ marginLeft: 6, alignSelf: "center" }} />
      </TouchableOpacity>;
    })}
    <View style={{ height: 10 }} />
  </AdminScreen>;
}

const styles = StyleSheet.create({
  search: { minHeight: 46, backgroundColor: C.panelDeep, borderColor: C.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, color: C.text, fontSize: 12 },
  memberCard: { flexDirection: "row", alignItems: "flex-start", padding: 12, marginBottom: 10, backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center", marginRight: 10 },
  info: { flex: 1 },
  name: { color: C.text, fontSize: 12, fontWeight: "800" },
  meta: { color: C.muted, fontSize: 9, marginTop: 4 },
  plan: { color: C.blue, fontSize: 9, marginTop: 5, fontWeight: "700" },
  badge: { fontSize: 7, fontWeight: "800", paddingHorizontal: 7, paddingVertical: 5, borderRadius: 10, overflow: "hidden" },
  active: { backgroundColor: "#123D2A", color: C.green },
  inactive: { backgroundColor: C.panelDeep, color: C.muted },
  muted: { color: C.muted, fontSize: 11 },
});
