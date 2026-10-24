import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminBottomNav, AdminLoading, AdminMessage, AdminPanel, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { errorMessage, formatAdminTime, loadAdminOverview } from "../../lib/admin-data";

type Overview = Awaited<ReturnType<typeof loadAdminOverview>>;

export default function AdminDashboard() {
  useThemeMode();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try { setData(await loadAdminOverview()); } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={C.blue} />}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>STAYFIT GYM</Text><Text style={styles.title}>Admin Dashboard</Text></View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/admin/requests" as never)}><Ionicons name="notifications-outline" size={20} color={C.text} />{(data?.pendingRequests ?? 0) > 0 && <View style={styles.dot} />}</TouchableOpacity>
        </View>

        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}><Text style={styles.muted}>MANAGEMENT OVERVIEW</Text><Text style={styles.welcomeTitle}>StayFit Admin</Text><Text style={styles.welcomeBody}>Live activity and member data from your gym.</Text></View>
          <View style={styles.shield}><Ionicons name="shield-checkmark" size={27} color={C.blue} /></View>
        </View>

        {error ? <AdminMessage>{error}</AdminMessage> : null}
        {loading && !data ? <AdminLoading /> : <>
          <AdminSectionTitle>Overview</AdminSectionTitle>
          <View style={styles.statsGrid}>
            <Stat icon="people-outline" value={data?.members ?? 0} label="Total Members" />
            <Stat icon="card-outline" value={data?.activeMemberships ?? 0} label="Active Memberships" />
            <Stat icon="checkmark-circle-outline" value={data?.checkIns ?? 0} label="Today's Check-ins" />
            <Stat icon="cash-outline" value={`₱${(data?.revenue ?? 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`} label="Paid This Month" />
          </View>

          <AdminSectionTitle>Quick Management</AdminSectionTitle>
          <View style={styles.actionGrid}>
            <Action icon="people-outline" label="Members" onPress={() => router.push("/admin/members" as never)} />
            <Action icon="calendar-outline" label="Classes" onPress={() => router.push("/admin/classes" as never)} />
            <Action icon="wallet-outline" label="Payments" onPress={() => router.push("/admin/payments" as never)} />
            <Action icon="clipboard-outline" label="Bookings" onPress={() => router.push("/admin/bookings" as never)} />
            <Action icon="file-tray-full-outline" label={`Requests${(data?.pendingRequests ?? 0) ? ` · ${data?.pendingRequests}` : ""}`} onPress={() => router.push("/admin/requests" as never)} />
            <Action icon="qr-code-outline" label="Scan Daily Pass" onPress={() => router.push("/admin/daily-pass-scanner" as never)} />
          </View>

          <AdminSectionTitle>Upcoming Classes</AdminSectionTitle>
          {(data?.classes.length ?? 0) === 0 ? <AdminPanel><Text style={styles.empty}>No upcoming classes are scheduled.</Text></AdminPanel> : data?.classes.map((item: any) => <AdminPanel key={item.id} style={styles.rowPanel}><View style={styles.iconTile}><Ionicons name="fitness-outline" size={20} color={C.blue} /></View><View style={styles.rowContent}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowSub}>{item.category} · {item.trainer_name}</Text><Text style={styles.rowSub}>{formatAdminTime(item.starts_at)} · {item.duration_minutes} min · capacity {item.capacity}</Text></View></AdminPanel>)}

          <AdminSectionTitle action={<TouchableOpacity onPress={() => router.push("/admin/bookings" as never)}><Text style={styles.manageBookings}>Manage all</Text></TouchableOpacity>}>Recent Bookings</AdminSectionTitle>
          {(data?.bookings.length ?? 0) === 0 ? <AdminPanel><Text style={styles.empty}>No class bookings yet.</Text></AdminPanel> : data?.bookings.map((booking: any) => <AdminPanel key={booking.id} style={styles.bookingPanel}><View style={styles.bookingMain}><Text style={styles.rowTitle}>{booking.profiles?.full_name || "Member"}</Text><Text style={styles.rowSub}>{booking.gym_classes?.name || "Class"} · {formatAdminTime(booking.created_at)}</Text></View><Text style={[styles.status, booking.status === "approved" ? styles.approved : booking.status === "pending" ? styles.pending : styles.other]}>{String(booking.status).toUpperCase()}</Text></AdminPanel>)}

          <AdminPanel style={styles.note}><Text style={styles.rowSub}>Pull down to refresh live totals. Revenue counts paid transactions recorded in Supabase.</Text></AdminPanel>
        </>}
      </ScrollView>
      <AdminBottomNav />
      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string }) {
  return <View style={styles.statCard}><View style={styles.statIcon}><Ionicons name={icon} size={19} color={C.blue} /></View><Text style={styles.statNumber}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.78}><View style={styles.actionIcon}><Ionicons name={icon} size={20} color={C.blue} /></View><Text style={styles.actionLabel}>{label}</Text><Ionicons name="chevron-forward" size={15} color={C.dim} /></TouchableOpacity>;
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: C.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  title: { color: C.text, fontSize: 21, fontWeight: "800" },
  notificationButton: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.panel, borderColor: C.border, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 8, right: 8, height: 7, width: 7, borderRadius: 4, backgroundColor: "#FF4D5E" },
  welcomeCard: { backgroundColor: C.panel, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 17, flexDirection: "row", alignItems: "center", marginBottom: 20 },
  muted: { color: C.muted, fontSize: 8, fontWeight: "700", letterSpacing: 1 },
  welcomeTitle: { color: C.text, fontSize: 20, fontWeight: "800", marginTop: 4 },
  welcomeBody: { color: C.muted, fontSize: 10, marginTop: 5, lineHeight: 15 },
  shield: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: "48.5%", backgroundColor: C.panel, borderRadius: 12, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: C.border },
  statIcon: { width: 35, height: 35, borderRadius: 9, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  statNumber: { color: C.text, fontSize: 20, fontWeight: "800" },
  statLabel: { color: C.muted, fontSize: 9, marginTop: 3, lineHeight: 13 },
  actionGrid: { gap: 8 },
  actionCard: { minHeight: 57, backgroundColor: C.panel, borderRadius: 11, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 11 },
  actionIcon: { width: 35, height: 35, borderRadius: 9, backgroundColor: C.panelDeep, borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center", marginRight: 10 },
  actionLabel: { flex: 1, color: C.text, fontSize: 11, fontWeight: "700" },
  rowPanel: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  iconTile: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.panelDeep, alignItems: "center", justifyContent: "center", marginRight: 11 },
  rowContent: { flex: 1 },
  rowTitle: { color: C.text, fontSize: 11, fontWeight: "800" },
  rowSub: { color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  bookingPanel: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  bookingMain: { flex: 1 },
  manageBookings: { color: C.blue, fontSize: 9, fontWeight: "700" },
  status: { fontSize: 7, fontWeight: "800", borderRadius: 12, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 5 },
  approved: { color: C.green, backgroundColor: "#123D2A" },
  pending: { color: "#F4C95D", backgroundColor: "#40351D" },
  other: { color: C.muted, backgroundColor: C.panelDeep },
  empty: { color: C.muted, fontSize: 11 },
  note: { marginTop: 9 },
  bottomLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: C.cyan, zIndex: 20 },
});
