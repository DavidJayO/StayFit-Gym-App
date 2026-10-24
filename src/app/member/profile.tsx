import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { loadMembership, loadProfile, getErrorMessage } from "../../lib/member-data";
import { ThemeSelector } from "../../components/theme-selector";

export default function Profile() {
  useThemeMode();
  const [name, setName] = useState("Member");
  const [email, setEmail] = useState("");
  const [membershipLabel, setMembershipLabel] = useState("No active membership");
  const [avatar, setAvatar] = useState("M");
  const [loadError, setLoadError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useEffect(() => { void Promise.all([loadProfile(), loadMembership()]).then(([p, m]) => {
    const displayName = p.full_name || p.email || "Member";
    setName(displayName); setEmail(p.email);
    setAvatar(displayName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase());
    setMembershipLabel(m ? `${m.plan_name} • ${m.status.toUpperCase()}` : "No active membership");
  }).catch((e) => setLoadError(getErrorMessage(e))); }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/login");
    } catch (error) {
      setLogoutError(getErrorMessage(error));
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity
            onPress={() => router.push("/member/notifications")}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* PROFILE */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>

          <Text style={styles.name}>{name}</Text>

          <Text style={styles.status}>
            {membershipLabel}
          </Text>
          {!!email && <Text style={styles.status}>{email}</Text>}
          {!!loadError && <Text style={styles.status}>{loadError}</Text>}
        </View>

        {/* MENU */}
        <View style={styles.menuContainer}>
          <ProfileItem
            title="My Membership"
            icon="card-outline"
            onPress={() =>
              router.push("/member/membership")
            }
          />

          <ProfileItem
            title="Membership Freeze"
            icon="snow-outline"
            onPress={() =>
              router.push("/member/freeze")
            }
          />

          <ProfileItem
            title="Payment Methods"
            icon="wallet-outline"
            onPress={() =>
              router.push("/member/payments")
            }
          />

          <ProfileItem
            title="Attendance History"
            icon="time-outline"
            onPress={() =>
              router.push("/member/attendance")
            }
          />

          <ProfileItem
            title="My Bookings"
            icon="calendar-outline"
            onPress={() =>
              router.push("/member/bookings")
            }
          />

          <ProfileItem
            title="Notifications"
            icon="notifications-outline"
            onPress={() =>
              router.push("/member/notifications")
            }
          />

        </View>

        <View style={styles.appearanceCard}>
          <ThemeSelector />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          <Ionicons
            name="log-out-outline"
            size={17}
            color="#FF5C5C"
          />

          <Text style={styles.logoutText}>{isLoggingOut ? "Signing out…" : "Logout"}</Text>
        </TouchableOpacity>
        {!!logoutError && <Text style={styles.status}>{logoutError}</Text>}
      </ScrollView>

      {/* BLUE BOTTOM LINE */}
      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

/* --------------------------------
   PROFILE MENU ITEM
-------------------------------- */

function ProfileItem({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon}
          size={17}
          color="#FFFFFF"
        />

        <Text style={styles.menuText}>
          {title}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={15}
        color="#98A2B3"
      />
    </TouchableOpacity>
  );
}

/* --------------------------------
   STYLES
-------------------------------- */

const styles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#06111C",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 35,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  /* PROFILE */

  profileSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#1769FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },

  status: {
    color: "#1ED760",
    fontSize: 11,
    fontWeight: "700",
  },

  /* MENU */

  menuContainer: {
    gap: 9,
  },

  appearanceCard: {
    marginTop: 18,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  menuItem: {
    height: 52,
    backgroundColor: "#102131",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 13,
  },

  /* LOGOUT */

  logoutButton: {
    height: 52,
    borderRadius: 10,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#3A2025",
    backgroundColor: "#151A20",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutText: {
    color: "#FF5C5C",
    fontSize: 13,
    fontWeight: "700",
  },

  /* BOTTOM */

  bottomLine: {
    height: 3,
    backgroundColor: "#169BFF",
    width: "100%",
  },
});
