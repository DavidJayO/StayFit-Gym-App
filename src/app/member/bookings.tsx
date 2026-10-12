
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, formatTime, getErrorMessage } from "../../lib/member-data";

type Booking = { id: string; name: string; trainer: string; date: string; time: string; category: string; icon: "barbell-outline" | "flash-outline" | "leaf-outline"; status: "Upcoming" | "Completed"; dbStatus: string };

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTab, setSelectedTab] = useState("Upcoming");
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      const userId = await currentUserId();
      const { data, error } = await supabase.from("class_bookings").select("id,status,gym_classes(name,category,trainer_name,starts_at,duration_minutes)").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      setBookings(((data ?? []) as any[]).map((row) => {
        const item = row.gym_classes;
        return { id: row.id, name: item?.name ?? "Class", trainer: item?.trainer_name ?? "Gym team", date: new Date(item?.starts_at).toLocaleDateString(), time: item ? `${formatTime(item.starts_at)} (${item.duration_minutes} min)` : "", category: item?.category ?? "Class", icon: item?.category?.toLowerCase().includes("yoga") ? "leaf-outline" : item?.category?.toLowerCase().includes("hiit") ? "flash-outline" : "barbell-outline", status: item && new Date(item.starts_at) < new Date() ? "Completed" : "Upcoming", dbStatus: row.status };
      }));
      setError("");
    } catch (e) { setError(getErrorMessage(e)); }
  };
  useEffect(() => { void loadBookings(); }, []);

  const visibleBookings = bookings.filter(
    (booking) => booking.status === selectedTab && !["cancelled", "rejected"].includes(booking.dbStatus)
  );

  const cancelBooking = async (booking: Booking) => {
    const { error } = await supabase.from("class_bookings").update({ status: "cancelled" }).eq("id", booking.id).eq("status", "pending");
    if (error) setError(error.message);
    else await loadBookings();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.replace("/member/dashboard")}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Bookings</Text>

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
      >
        <Text style={styles.eyebrow}>STAYFIT GYM</Text>
        <Text style={styles.title}>Your Classes</Text>
        <Text style={styles.subtitle}>
          Manage your reservations and stay on schedule.
        </Text>
        {!!error && <Text style={styles.detailText}>{error}</Text>}

        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <Ionicons
              name="calendar-outline"
              size={25}
              color="#4D8DFF"
            />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsTitle}>My Reservations</Text>
            <Text style={styles.statsSubtitle}>
              {bookings.filter((item) => item.status === "Upcoming").length}{" "}
              upcoming classes
            </Text>
          </View>
          <Text style={styles.statsNumber}>
            {bookings.filter((item) => item.status === "Upcoming").length}
          </Text>
        </View>

        <View style={styles.tabs}>
          {["Upcoming", "Completed"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedTab} Classes
          </Text>
          <Text style={styles.count}>{visibleBookings.length} total</Text>
        </View>

        {visibleBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={42}
              color="#4D8DFF"
            />
            <Text style={styles.emptyTitle}>No {selectedTab.toLowerCase()} bookings</Text>
            <Text style={styles.emptyText}>
              {selectedTab === "Upcoming"
                ? "Explore available classes and reserve your next workout."
                : "Your completed classes will appear here."}
            </Text>
            {selectedTab === "Upcoming" && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/member/classes")}
              >
                <Text style={styles.primaryButtonText}>Browse Classes</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          visibleBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.cardTop}>
                <View style={styles.classIcon}>
                  <Ionicons
                    name={booking.icon}
                    size={24}
                    color="#4D8DFF"
                  />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{booking.name}</Text>
                  <Text style={styles.trainer}>{booking.trainer}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    booking.status === "Completed" && styles.completedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      booking.status === "Completed" &&
                        styles.completedText,
                    ]}
                  >
                    {booking.status === "Completed" ? "COMPLETED" : booking.dbStatus === "approved" ? "BOOKED" : "PENDING"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color="#4D8DFF"
                />
                <Text style={styles.detailText}>{booking.date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color="#4D8DFF"
                />
                <Text style={styles.detailText}>{booking.time}</Text>
              </View>

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{booking.category}</Text>
              </View>

              {booking.status === "Upcoming" && booking.dbStatus === "pending" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.accessButton}
                    onPress={() => router.push("/member/access")}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>Gym Access</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelBooking(booking)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push("/member/classes")}
        >
          <Ionicons name="add-circle-outline" size={20} color="#4D8DFF" />
          <Text style={styles.browseText}>Book Another Class</Text>
          <Ionicons
            name="chevron-forward"
            size={19}
            color="#98A2B3"
          />
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

const styles = StyleSheet.create({
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
  statsCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 15,
    padding: 15, marginBottom: 23,
  },
  statsIcon: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: "#142C4A", alignItems: "center",
    justifyContent: "center", marginRight: 12,
  },
  statsInfo: { flex: 1 },
  statsTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  statsSubtitle: { color: "#98A2B3", fontSize: 11, marginTop: 5 },
  statsNumber: { color: "#4D8DFF", fontSize: 25, fontWeight: "800" },
  tabs: {
    flexDirection: "row", backgroundColor: "#0B1A28",
    padding: 4, borderRadius: 11, marginBottom: 23,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#1769FF" },
  tabText: { color: "#98A2B3", fontSize: 12, fontWeight: "600" },
  activeTabText: { color: "#FFFFFF" },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 13,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  count: { color: "#98A2B3", fontSize: 11 },
  bookingCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 16,
    padding: 15, marginBottom: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  classIcon: {
    width: 45, height: 45, borderRadius: 12,
    backgroundColor: "#142C4A", alignItems: "center",
    justifyContent: "center", marginRight: 11,
  },
  classInfo: { flex: 1 },
  className: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  trainer: { color: "#98A2B3", fontSize: 11, marginTop: 5 },
  statusBadge: {
    backgroundColor: "#123D2A", paddingHorizontal: 8,
    paddingVertical: 6, borderRadius: 7,
  },
  statusText: { color: "#54D98C", fontSize: 9, fontWeight: "800" },
  completedBadge: { backgroundColor: "#142C4A" },
  completedText: { color: "#4D8DFF" },
  divider: { height: 1, backgroundColor: "#24394A", marginVertical: 14 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 11 },
  detailText: { color: "#D0D5DD", fontSize: 11 },
  categoryBadge: {
    alignSelf: "flex-start", backgroundColor: "#0B1A28",
    borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6,
    marginTop: 1, marginBottom: 14,
  },
  categoryText: { color: "#98A2B3", fontSize: 10 },
  actions: { flexDirection: "row", gap: 10 },
  accessButton: {
    flex: 1, height: 42, borderRadius: 9,
    backgroundColor: "#1769FF", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 7,
  },
  actionButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  cancelButton: {
    paddingHorizontal: 17, height: 42, borderRadius: 9,
    backgroundColor: "#0B1A28", borderWidth: 1,
    borderColor: "#344454", justifyContent: "center",
  },
  cancelButtonText: { color: "#D0D5DD", fontSize: 11, fontWeight: "600" },
  emptyCard: {
    alignItems: "center", backgroundColor: "#102131",
    borderWidth: 1, borderColor: "#1C3040",
    borderRadius: 16, padding: 25,
  },
  emptyTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginTop: 14 },
  emptyText: {
    color: "#98A2B3", fontSize: 12, lineHeight: 19,
    textAlign: "center", marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#1769FF", borderRadius: 9,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 18,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  browseButton: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 12,
    padding: 15, marginTop: 6,
  },
  browseText: { flex: 1, color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
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
