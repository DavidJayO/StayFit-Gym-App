import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Profile() {
  const handleMenuPress = (item: string) => {
    Alert.alert(item, `${item} page will be available soon.`);
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
            onPress={() =>
              Alert.alert("Notifications", "No new notifications.")
            }
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
            <Text style={styles.avatarText}>DJ</Text>
          </View>

          <Text style={styles.name}>David Jay Ongcoy</Text>

          <Text style={styles.status}>
            Premium Member • ACTIVE
          </Text>
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

          <ProfileItem
            title="Referral & Rewards"
            icon="gift-outline"
            onPress={() =>
              router.push("/member/rewards")
            }
          />

          <ProfileItem
            title="Help & Support"
            icon="help-circle-outline"
            onPress={() =>
              router.push("/member/support")
            }
          />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert(
              "Logout",
              "Are you sure you want to logout?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: () => router.replace("/login"),
                },
              ]
            )
          }
        >
          <Ionicons
            name="log-out-outline"
            size={17}
            color="#FF5C5C"
          />

          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
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