import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { errorMessage, formatAdminTime, loadAdminBookings, setAdminBookingStatus } from "../../lib/admin-data";

type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";
type BookingProfile = { full_name: string | null; email: string | null };
type BookingClass = { name: string; category: string; trainer_name: string; starts_at: string; duration_minutes: number; capacity: number };
type Booking = {
  id: string;
  status: BookingStatus;
  created_at: string;
  profiles: BookingProfile | BookingProfile[] | null;
  gym_classes: BookingClass | BookingClass[] | null;
};
const filters = ["all", "pending", "approved", "rejected", "cancelled"] as const;
type Filter = typeof filters[number];

export default function AdminBookings() {
  useThemeMode();
  const [rows, setRows] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try { setRows(await loadAdminBookings() as Booking[]); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((row) => row.status === "pending").length,
    approved: rows.filter((row) => row.status === "approved").length,
    rejected: rows.filter((row) => row.status === "rejected").length,
    cancelled: rows.filter((row) => row.status === "cancelled").length,
  }), [rows]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query) return true;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const gymClass = Array.isArray(row.gym_classes) ? row.gym_classes[0] : row.gym_classes;
      return [profile?.full_name, profile?.email, gymClass?.name, gymClass?.trainer_name]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [filter, rows, search]);

  async function updateBooking(row: Booking, status: Exclude<BookingStatus, "pending">) {
    setBusyId(row.id);
    setError("");
    try {
      await setAdminBookingStatus(row.id, status);
      await load(true);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusyId(""); }
  }

  return <AdminScreen title="Class Bookings" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.blue} />}>
    <AdminMessage tone="info">Review member requests for classes. Approve a pending booking, reject it, or cancel an approved booking. Changes are saved to the gym booking records.</AdminMessage>
    {error ? <AdminMessage>{error}</AdminMessage> : null}

    <View style={styles.searchBox}>
      <Ionicons name="search-outline" size={16} color={C.muted} />
      <TextInput value={search} onChangeText={setSearch} placeholder="Search member, class, or trainer" placeholderTextColor={C.dim} style={styles.searchInput} returnKeyType="search" />
      {search ? <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={C.muted} /></TouchableOpacity> : null}
    </View>

    <View style={styles.filterRow}>
      {filters.map((item) => <TouchableOpacity key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}>
        <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)} ({counts[item]})</Text>
      </TouchableOpacity>)}
    </View>

    <AdminSectionTitle>{loading ? "Loading bookings" : `${visible.length} ${filter === "all" ? "bookings" : `${filter} bookings`}`}</AdminSectionTitle>
    {loading && rows.length === 0 ? <AdminLoading /> : visible.length === 0 ? <AdminPanel><Text style={styles.empty}>{search ? "No bookings match your search." : filter === "pending" ? "No pending class bookings." : "No bookings in this section."}</Text></AdminPanel> : visible.map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const bookingClass = Array.isArray(row.gym_classes) ? row.gym_classes[0] : row.gym_classes;
      const statusStyle = row.status === "approved" ? styles.approved : row.status === "pending" ? styles.pending : row.status === "rejected" ? styles.rejected : styles.cancelled;
      return <AdminPanel key={row.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.classIcon}><Ionicons name="barbell-outline" size={18} color={C.blue} /></View>
          <View style={styles.mainInfo}>
            <Text style={styles.className}>{bookingClass?.name ?? "Class unavailable"}</Text>
            <Text style={styles.memberName}>{profile?.full_name || "Member"}</Text>
            {profile?.email ? <Text style={styles.meta}>{profile.email}</Text> : null}
          </View>
          <Text style={[styles.badge, statusStyle]}>{row.status.toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}><Ionicons name="calendar-outline" size={14} color={C.muted} /><Text style={styles.meta}>{bookingClass ? formatAdminTime(bookingClass.starts_at) : "Class schedule unavailable"}</Text></View>
        {bookingClass ? <Text style={styles.meta}>{bookingClass.category} · {bookingClass.trainer_name} · {bookingClass.duration_minutes} min</Text> : null}
        <Text style={styles.requested}>Requested {formatAdminTime(row.created_at)}</Text>
        {row.status === "pending" ? <View style={styles.actions}>
          <TouchableOpacity disabled={busyId === row.id} style={styles.rejectButton} onPress={() => void updateBooking(row, "rejected")}><Text style={styles.rejectText}>{busyId === row.id ? "Saving…" : "Reject"}</Text></TouchableOpacity>
          <TouchableOpacity disabled={busyId === row.id} style={styles.approveButton} onPress={() => void updateBooking(row, "approved")}><Text style={styles.approveText}>{busyId === row.id ? "Saving…" : "Approve booking"}</Text></TouchableOpacity>
        </View> : row.status === "approved" ? <TouchableOpacity disabled={busyId === row.id} style={styles.cancelButton} onPress={() => void updateBooking(row, "cancelled")}><Text style={styles.rejectText}>{busyId === row.id ? "Saving…" : "Cancel booking"}</Text></TouchableOpacity> : null}
      </AdminPanel>;
    })}
  </AdminScreen>;
}

const styles = createThemeStyles({
  searchBox: { minHeight: 43, backgroundColor: C.panel, borderColor: C.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, color: C.text, fontSize: 11, minHeight: 40 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  filterChip: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.blueStrong, borderColor: C.blueStrong },
  filterText: { color: C.muted, fontSize: 9, fontWeight: "700" },
  filterTextActive: { color: C.text },
  card: { marginBottom: 9 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 9 },
  classIcon: { width: 37, height: 37, borderRadius: 9, backgroundColor: C.panelDeep, alignItems: "center", justifyContent: "center" },
  mainInfo: { flex: 1 },
  className: { color: C.text, fontSize: 12, fontWeight: "800" },
  memberName: { color: C.text, fontSize: 10, fontWeight: "600", marginTop: 4 },
  meta: { color: C.muted, fontSize: 9, marginTop: 4 },
  badge: { fontSize: 7, fontWeight: "800", paddingHorizontal: 7, paddingVertical: 5, borderRadius: 12, overflow: "hidden" },
  pending: { color: "#F4C95D", backgroundColor: "#40351D" },
  approved: { color: C.green, backgroundColor: "#123D2A" },
  rejected: { color: C.red, backgroundColor: "#351B25" },
  cancelled: { color: C.muted, backgroundColor: C.panelDeep },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  requested: { color: C.dim, fontSize: 8, marginTop: 8 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 12 },
  rejectButton: { minHeight: 34, paddingHorizontal: 13, justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: C.borderBright },
  rejectText: { color: C.muted, fontSize: 9, fontWeight: "800" },
  approveButton: { minHeight: 34, paddingHorizontal: 13, justifyContent: "center", borderRadius: 8, backgroundColor: C.blueStrong },
  approveText: { color: C.text, fontSize: 9, fontWeight: "800" },
  cancelButton: { alignSelf: "flex-end", minHeight: 34, paddingHorizontal: 13, justifyContent: "center", marginTop: 12, borderRadius: 8, borderWidth: 1, borderColor: "#713344" },
  empty: { color: C.muted, fontSize: 11 },
});
