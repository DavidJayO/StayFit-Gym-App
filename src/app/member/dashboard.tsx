import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, formatDate, loadMembership, loadProfile, Membership, getErrorMessage } from "../../lib/member-data";

export default function Dashboard() {
  useThemeMode();
  const [name, setName] = useState("Member");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [nextClass, setNextClass] = useState<any>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [unread, setUnread] = useState(false);
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => { void (async () => {
    try {
      const [profile, plan, userId] = await Promise.all([loadProfile(), loadMembership(), currentUserId()]);
      setName(profile.full_name?.split(" ")[0] || profile.email || "Member"); setMembership(plan);
      const { data, error: bookingError } = await supabase.from("class_bookings").select("status,gym_classes(name,trainer_name,starts_at,duration_minutes)").eq("user_id", userId).in("status", ["pending", "approved"]).order("created_at", { ascending: false });
      if (bookingError) throw bookingError;
      const upcoming = ((data ?? []) as any[]).filter((row) => row.gym_classes && new Date(row.gym_classes.starts_at) > new Date()).sort((a, b) => new Date(a.gym_classes.starts_at).getTime() - new Date(b.gym_classes.starts_at).getTime());
      setNextClass(upcoming[0]?.gym_classes ?? null);
      const { count: attendanceCount, error: attendanceError } = await supabase.from("attendance").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if (attendanceError) throw attendanceError;
      setVisitCount(attendanceCount ?? 0);
      const { count: notificationCount, error: notificationError } = await supabase.from("member_notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
      if (!notificationError) setUnread((notificationCount ?? 0) > 0);
    } catch (e) { setError(getErrorMessage(e)); }
  })(); }, []));
  const active = !!membership && membership.status === "active" && new Date(`${membership.ends_on}T23:59:59`) >= new Date();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>WELCOME BACK</Text>
            <Text style={styles.greeting}>{name} 👋</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/member/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#FFFFFF"
            />

            {unread && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>

        {/* MEMBERSHIP CARD */}
        <TouchableOpacity
          style={styles.membershipCard}
          activeOpacity={0.85}
          onPress={() => router.push("/member/membership")}
        >
          <View style={styles.membershipTop}>
            <View>
              <Text style={styles.cardLabel}>MEMBERSHIP</Text>
              <Text style={styles.planName}>{membership?.plan_name ?? "No membership on file"}</Text>
            </View>

            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>{active ? "ACTIVE" : membership?.status?.toUpperCase() ?? "NONE"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.membershipBottom}>
            <View>
              <Text style={styles.cardLabel}>VALID UNTIL</Text>
              <Text style={styles.dateText}>{formatDate(membership?.ends_on)}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color="#98A2B3"
            />
          </View>
        </TouchableOpacity>

        {/* ACCESS PASS */}
        <TouchableOpacity
          style={styles.accessCard}
          activeOpacity={0.85}
          onPress={() => router.push("/member/access")}
        >
          <View style={styles.accessIcon}>
            <Ionicons
              name="qr-code-outline"
              size={25}
              color="#4D8DFF"
            />
          </View>

          <View style={styles.accessInfo}>
            <Text style={styles.accessTitle}>
              Gym Access Pass
            </Text>

            <Text style={styles.accessSubtitle}>
              Show your membership details to gym staff
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={17}
            color="#98A2B3"
          />
        </TouchableOpacity>

        {/* SECTION TITLE */}
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        {/* QUICK ACTIONS */}
        <View style={styles.actionGrid}>
          <ActionCard
            icon="calendar-outline"
            title="Book a Class"
            onPress={() => router.push("/member/classes")}
          />

          <ActionCard
            icon="ticket-outline"
            title="Daily Pass"
            onPress={() => router.push("/member/daily-pass")}
          />

          <ActionCard
            icon="card-outline"
            title="Membership"
            onPress={() => router.push("/member/membership")}
          />

          <ActionCard
            icon="time-outline"
            title={`Attendance · ${visitCount} visits`}
            onPress={() => router.push("/member/attendance")}
          />
        </View>

        {/* UPCOMING CLASS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Upcoming Class
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/member/bookings")}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.classCard}
          activeOpacity={0.85}
          onPress={() => router.push("/member/bookings")}
        >
          <View style={styles.classIcon}>
            <Ionicons
              name="fitness-outline"
              size={23}
              color="#4D8DFF"
            />
          </View>

          {error ? <Text style={styles.coach}>{error}</Text> : nextClass ? <>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{nextClass.name}</Text>

            <Text style={styles.classDetails}>
              {new Date(nextClass.starts_at).toLocaleDateString()} • {new Date(nextClass.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {nextClass.duration_minutes} min
            </Text>

            <Text style={styles.coach}>
              {nextClass.trainer_name}
            </Text>
          </View>
          <View style={styles.bookedBadge}>
            <Text style={styles.bookedText}>BOOKED</Text>
          </View></> : <Text style={styles.className}>No upcoming class booking</Text>}
        </TouchableOpacity>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <NavItem
            icon="home"
            label="Home"
            active
            onPress={() => router.push("/member/dashboard")}
          />

          <NavItem
            icon="calendar-outline"
            label="Classes"
            onPress={() => router.push("/member/classes")}
          />

          <TouchableOpacity
            style={styles.centerAccess}
            onPress={() => router.push("/member/access")}
          >
            <View style={styles.qrButton}>
              <Ionicons
                name="qr-code-outline"
                size={23}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.navText}>Access</Text>
          </TouchableOpacity>

          <NavItem
            icon="card-outline"
            label="Membership"
            onPress={() => router.push("/member/membership")}
          />

          <NavItem
            icon="person-outline"
            label="Profile"
            onPress={() => router.push("/member/profile")}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

/* ACTION CARD */

function ActionCard({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#4D8DFF"
        />
      </View>

      <Text style={styles.actionTitle}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* NAV ITEM */

function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? "#4D8DFF" : "#667085"}
      />

      <Text
        style={[
          styles.navText,
          active && styles.navTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* STYLES */

const styles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#06111C",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  smallText: {
    color: "#98A2B3",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },

  greeting: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#102131",
    justifyContent: "center",
    alignItems: "center",
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF4D5E",
    borderWidth: 1,
    borderColor: "#102131",
  },

  /* MEMBERSHIP */

  membershipCard: {
    backgroundColor: "#102131",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1D3A55",
  },

  membershipTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  cardLabel: {
    color: "#98A2B3",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 5,
  },

  planName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#123D2A",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1ED760",
    marginRight: 5,
  },

  activeText: {
    color: "#1ED760",
    fontSize: 8,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#24394A",
    marginVertical: 17,
  },

  membershipBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ACCESS */

  accessCard: {
    backgroundColor: "#102131",
    borderRadius: 10,
    marginTop: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1D3A55",
  },

  accessIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#122F4B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  accessInfo: {
    flex: 1,
  },

  accessTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },

  accessSubtitle: {
    color: "#98A2B3",
    fontSize: 9,
  },

  /* SECTIONS */

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  seeAll: {
    color: "#4D8DFF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 14,
  },

  /* ACTIONS */

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  actionCard: {
    width: "48%",
    minHeight: 82,
    backgroundColor: "#102131",
    borderRadius: 10,
    padding: 13,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#122F4B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  actionTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  /* CLASS */

  classCard: {
    backgroundColor: "#102131",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  classIcon: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: "#122F4B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  classInfo: {
    flex: 1,
  },

  className: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },

  classDetails: {
    color: "#AFC0D0",
    fontSize: 9,
    marginBottom: 3,
  },

  coach: {
    color: "#667085",
    fontSize: 9,
  },

  bookedBadge: {
    backgroundColor: "#123D2A",
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 15,
  },

  bookedText: {
    color: "#1ED760",
    fontSize: 7,
    fontWeight: "800",
  },

  /* BOTTOM NAV */

  bottomNav: {
    height: 67,
    backgroundColor: "#102131",
    borderRadius: 13,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 55,
  },

  navText: {
    color: "#667085",
    fontSize: 8,
    fontWeight: "600",
    marginTop: 4,
  },

  navTextActive: {
    color: "#4D8DFF",
  },

  centerAccess: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -12,
  },

  qrButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1769FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#06111C",
  },

  /* BOTTOM LINE */

  bottomLine: {
    height: 3,
    backgroundColor: "#169BFF",
    width: "100%",
  },
});
