import { createThemeStyles, useThemeMode } from "../../lib/theme";

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, getErrorMessage } from "../../lib/member-data";

export default function Attendance() {
  useThemeMode();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const userId = await currentUserId();
      const { data, error } = await supabase.from("attendance").select("id,checked_in_at,checked_out_at").eq("user_id", userId).order("checked_in_at", { ascending: false });
      if (error) throw error;
      setAttendanceRecords((data ?? []).map((r) => {
        const minutes = r.checked_out_at ? Math.max(0, Math.round((new Date(r.checked_out_at).getTime() - new Date(r.checked_in_at).getTime()) / 60000)) : null;
        return { id: r.id, date: new Date(r.checked_in_at).toLocaleDateString(), time: new Date(r.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), type: "Gym check-in", duration: minutes === null ? "In progress" : `${Math.floor(minutes / 60)}h ${minutes % 60}m`, completed: minutes !== null, checkedAt: r.checked_in_at };
      }));
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void loadAttendance(); }, [loadAttendance]));
  const now = new Date();
  const visitsThisWeek = attendanceRecords.filter((r) => new Date(r.checkedAt).getTime() >= now.getTime() - 7 * 86400000).length;
  const visitsThisMonth = attendanceRecords.filter((r) => { const d = new Date(r.checkedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const completedRecords = attendanceRecords.filter((r) => r.completed);
  const avgMinutes = completedRecords.length ? Math.round(completedRecords.reduce((total, r) => total + parseInt(r.duration, 10) * 60 + parseInt(r.duration.split("h ")[1], 10), 0) / completedRecords.length) : 0;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.replace("/member/dashboard")}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Attendance</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/member/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadAttendance()} tintColor="#4D8DFF" />}
      >
        <Text style={styles.eyebrow}>STAYFIT GYM</Text>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>
          Track your gym visits and workout consistency.
        </Text>

        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={styles.overviewIcon}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color="#4D8DFF"
              />
            </View>
            <View style={styles.overviewInfo}>
              <Text style={styles.overviewLabel}>TOTAL VISITS</Text>
              <Text style={styles.overviewNumber}>{attendanceRecords.length}</Text>
              <Text style={styles.overviewCaption}>
                Visits recorded by gym staff
              </Text>
            </View>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{visitsThisWeek}</Text>
              <Text style={styles.statLabel}>This week</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{visitsThisMonth}</Text>
              <Text style={styles.statLabel}>This month</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgMinutes ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : "—"}</Text>
              <Text style={styles.statLabel}>Avg. visit</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="trophy-outline" size={22} color="#F0B45A" />
          </View>
          <View style={styles.tipInfo}>
            <Text style={styles.tipTitle}>Keep showing up!</Text>
            <Text style={styles.tipText}>
              Consistency is the key to reaching your fitness goals.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Visits</Text>
          <Text style={styles.recordCount}>
            {attendanceRecords.length} records
          </Text>
        </View>
        {!!error && <Text style={styles.noteText}>{error}</Text>}
        {attendanceRecords.length === 0 && !error && <Text style={styles.noteText}>No visits are recorded yet. Gym staff add verified check-ins.</Text>}

        {attendanceRecords.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordIcon}>
              <Ionicons
                name="checkmark-circle"
                size={23}
                color="#54D98C"
              />
            </View>

            <View style={styles.recordInfo}>
              <Text style={styles.recordDate}>{record.date}</Text>
              <Text style={styles.recordTime}>{record.time}</Text>
              <View style={styles.accessType}>
                <Ionicons
                  name="scan-outline"
                  size={13}
                  color="#4D8DFF"
                />
                <Text style={styles.accessTypeText}>{record.type}</Text>
              </View>
            </View>

            <View style={styles.recordRight}>
              <Text style={styles.duration}>{record.duration}</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>{record.completed ? "COMPLETED" : "CHECKED IN"}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#4D8DFF"
          />
          <Text style={styles.noteText}>
            Attendance is read-only here and reflects check-in and check-out events recorded by gym staff.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.accessButton}
          onPress={() => router.push("/member/access")}
        >
          <Ionicons name="qr-code-outline" size={19} color="#FFFFFF" />
          <Text style={styles.accessButtonText}>View Gym Access Pass</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.footer}>
          STAYFIT GYM • MEMBERSHIP • FITNESS • COMMUNITY
        </Text>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem
          icon="home-outline"
          label="Home"
          onPress={() => router.replace("/member/dashboard")}
        />
        <NavItem
          icon="barbell-outline"
          label="Classes"
          onPress={() => router.push("/member/classes")}
        />
        <NavItem
          icon="qr-code-outline"
          label="Access"
          onPress={() => router.push("/member/access")}
        />
        <NavItem
          icon="card-outline"
          label="Membership"
          onPress={() => router.push("/member/membership")}
        />
        <NavItem
          icon="person-outline"
          label="Profile"
          onPress={() => router.replace("/member/profile")}
        />
      </View>

      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

function NavItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={21} color="#98A2B3" />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" },
  header: {
    height: 54, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 18,
  },
  headerButton: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "#102131", alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 25 },
  eyebrow: {
    color: "#4D8DFF", fontSize: 10, fontWeight: "800",
    letterSpacing: 2, marginBottom: 7,
  },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "800" },
  subtitle: { color: "#98A2B3", fontSize: 12, marginTop: 6, marginBottom: 20 },
  overviewCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 16, padding: 17,
    marginBottom: 16,
  },
  overviewTop: { flexDirection: "row", alignItems: "center" },
  overviewIcon: {
    width: 49, height: 49, borderRadius: 13,
    backgroundColor: "#142C4A", alignItems: "center",
    justifyContent: "center", marginRight: 13,
  },
  overviewInfo: { flex: 1 },
  overviewLabel: {
    color: "#98A2B3", fontSize: 10,
    fontWeight: "700", letterSpacing: 1,
  },
  overviewNumber: { color: "#FFFFFF", fontSize: 29, fontWeight: "800", marginTop: 3 },
  overviewCaption: { color: "#98A2B3", fontSize: 10, marginTop: 3 },
  overviewDivider: { height: 1, backgroundColor: "#24394A", marginVertical: 17 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#4D8DFF", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "#98A2B3", fontSize: 10, marginTop: 5 },
  statSeparator: { width: 1, height: 31, backgroundColor: "#24394A" },
  tipCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 13,
    padding: 13, marginBottom: 25,
  },
  tipIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#332C1F", alignItems: "center",
    justifyContent: "center", marginRight: 11,
  },
  tipInfo: { flex: 1 },
  tipTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  tipText: { color: "#98A2B3", fontSize: 10, lineHeight: 16, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 13,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  recordCount: { color: "#98A2B3", fontSize: 11 },
  recordCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 13,
    padding: 13, marginBottom: 10,
  },
  recordIcon: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: "#123D2A", alignItems: "center",
    justifyContent: "center", marginRight: 10,
  },
  recordInfo: { flex: 1 },
  recordDate: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  recordTime: { color: "#98A2B3", fontSize: 10, marginTop: 5 },
  accessType: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 },
  accessTypeText: { color: "#4D8DFF", fontSize: 9 },
  recordRight: { alignItems: "flex-end", gap: 8 },
  duration: { color: "#D0D5DD", fontSize: 11, fontWeight: "600" },
  completedBadge: { backgroundColor: "#123D2A", padding: 5, borderRadius: 5 },
  completedText: { color: "#54D98C", fontSize: 8, fontWeight: "800" },
  noteCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 9,
    backgroundColor: "#0B1A28", borderRadius: 11,
    padding: 13, marginTop: 8,
  },
  noteText: { flex: 1, color: "#98A2B3", fontSize: 10, lineHeight: 17 },
  accessButton: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9,
    backgroundColor: "#1769FF", borderRadius: 10,
    height: 47, marginTop: 16,
  },
  accessButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  footer: {
    color: "#667085", fontSize: 9, textAlign: "center",
    marginTop: 25, letterSpacing: 0.5,
  },
  bottomNav: {
    height: 65, flexDirection: "row", backgroundColor: "#0B1A28",
    borderTopWidth: 1, borderTopColor: "#1C3040",
    justifyContent: "space-around", alignItems: "center", paddingHorizontal: 4,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: "#98A2B3", fontSize: 9 },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
