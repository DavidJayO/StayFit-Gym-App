import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>STAYFIT GYM</Text>
            <Text style={styles.title}>Admin Dashboard</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/admin/notifications")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#FFFFFF"
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* WELCOME CARD */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeSmall}>Welcome back,</Text>

            <Text style={styles.welcomeName}>
              Admin 👋
            </Text>

            <Text style={styles.welcomeDescription}>
              Here's what's happening at StayFit today.
            </Text>
          </View>

          <View style={styles.adminIcon}>
            <Ionicons
              name="shield-checkmark"
              size={28}
              color="#4D8DFF"
            />
          </View>
        </View>

        {/* OVERVIEW */}
        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.statsGrid}>
          {/* Members */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="people-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <Text style={styles.statNumber}>128</Text>

            <Text style={styles.statLabel}>
              Total Members
            </Text>
          </View>

          {/* Memberships */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="card-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <Text style={styles.statNumber}>96</Text>

            <Text style={styles.statLabel}>
              Active Memberships
            </Text>
          </View>

          {/* Check-ins */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <Text style={styles.statNumber}>42</Text>

            <Text style={styles.statLabel}>
              Today's Check-ins
            </Text>
          </View>

          {/* Revenue */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="cash-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <Text style={styles.statNumber}>₱24.5K</Text>

            <Text style={styles.statLabel}>
              Monthly Revenue
            </Text>
          </View>
        </View>

        {/* QUICK MANAGEMENT */}
        <Text style={styles.sectionTitle}>
          Quick Management
        </Text>

        <View style={styles.managementCard}>
          {/* MEMBERS */}
          <TouchableOpacity
            style={styles.managementItem}
            onPress={() => router.push("/admin/members")}
            activeOpacity={0.7}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="people-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.managementText}>
              <Text style={styles.managementTitle}>
                Members
              </Text>

              <Text style={styles.managementDescription}>
                Manage gym members
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#667085"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* CLASSES */}
          <TouchableOpacity
            style={styles.managementItem}
            onPress={() => router.push("/admin/classes")}
            activeOpacity={0.7}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.managementText}>
              <Text style={styles.managementTitle}>
                Classes
              </Text>

              <Text style={styles.managementDescription}>
                Manage schedules and bookings
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#667085"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* PAYMENTS */}
          <TouchableOpacity
            style={styles.managementItem}
            onPress={() => router.push("/admin/payments")}
            activeOpacity={0.7}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.managementText}>
              <Text style={styles.managementTitle}>
                Payments
              </Text>

              <Text style={styles.managementDescription}>
                Review payment transactions
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#667085"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* REPORTS */}
          <TouchableOpacity
            style={styles.managementItem}
            onPress={() => router.push("/admin/reports")}
            activeOpacity={0.7}
          >
            <View style={styles.managementIcon}>
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.managementText}>
              <Text style={styles.managementTitle}>
                Reports
              </Text>

              <Text style={styles.managementDescription}>
                View gym reports and statistics
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#667085"
            />
          </TouchableOpacity>
        </View>

        {/* TODAY'S ACTIVITY */}
        <Text style={styles.sectionTitle}>
          Today's Activity
        </Text>

        <View style={styles.activityCard}>
          {/* CHECK-INS */}
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <Ionicons
                name="log-in-outline"
                size={19}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>
                Member Check-ins
              </Text>

              <Text style={styles.activitySubtext}>
                42 members checked in today
              </Text>
            </View>

            <Text style={styles.activityNumber}>
              42
            </Text>
          </View>

          <View style={styles.divider} />

          {/* DAILY PASSES */}
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <Ionicons
                name="ticket-outline"
                size={19}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>
                Daily Passes
              </Text>

              <Text style={styles.activitySubtext}>
                Passes purchased today
              </Text>
            </View>

            <Text style={styles.activityNumber}>
              8
            </Text>
          </View>

          <View style={styles.divider} />

          {/* CLASS BOOKINGS */}
          <View style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <Ionicons
                name="fitness-outline"
                size={19}
                color="#4D8DFF"
              />
            </View>

            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>
                Class Bookings
              </Text>

              <Text style={styles.activitySubtext}>
                Classes booked today
              </Text>
            </View>

            <Text style={styles.activityNumber}>
              26
            </Text>
          </View>
        </View>

        <View style={{ height: 25 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {/* HOME */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/admin/dashboard")}
        >
          <Ionicons
            name="home"
            size={21}
            color="#1769FF"
          />

          <Text style={[styles.navText, styles.activeNavText]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* MEMBERS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/admin/members")}
        >
          <Ionicons
            name="people-outline"
            size={21}
            color="#667085"
          />

          <Text style={styles.navText}>
            Members
          </Text>
        </TouchableOpacity>

        {/* CLASSES */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/admin/classes")}
        >
          <Ionicons
            name="calendar-outline"
            size={21}
            color="#667085"
          />

          <Text style={styles.navText}>
            Classes
          </Text>
        </TouchableOpacity>

        {/* PAYMENTS */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/admin/payments")}
        >
          <Ionicons
            name="wallet-outline"
            size={21}
            color="#667085"
          />

          <Text style={styles.navText}>
            Payments
          </Text>
        </TouchableOpacity>

        {/* MORE */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/admin/settings")}
        >
          <Ionicons
            name="menu-outline"
            size={21}
            color="#667085"
          />

          <Text style={styles.navText}>
            More
          </Text>
        </TouchableOpacity>
      </View>

      {/* BLUE BOTTOM LINE */}
      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06111C",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 105,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  smallText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#98A2B3",
    letterSpacing: 1,
    marginBottom: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#1C3040",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  notificationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF4D5E",
    position: "absolute",
    top: 8,
    right: 9,
  },

  /* WELCOME */

  welcomeCard: {
    backgroundColor: "#102131",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C3040",
    marginBottom: 24,
  },

  welcomeContent: {
    flex: 1,
  },

  welcomeSmall: {
    fontSize: 11,
    color: "#98A2B3",
  },

  welcomeName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 3,
  },

  welcomeDescription: {
    fontSize: 10.5,
    color: "#98A2B3",
    marginTop: 5,
    maxWidth: 230,
    lineHeight: 16,
  },

  adminIcon: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: "#0B1A28",
    borderWidth: 1,
    borderColor: "#1D3A55",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  /* SECTION */

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 11,
  },

  /* STATISTICS */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 23,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#102131",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  statIcon: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: "#0B1A28",
    borderWidth: 1,
    borderColor: "#1D3A55",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  statLabel: {
    fontSize: 10,
    color: "#98A2B3",
    marginTop: 3,
    lineHeight: 14,
  },

  /* MANAGEMENT */

  managementCard: {
    backgroundColor: "#102131",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 23,
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  managementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  managementIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#0B1A28",
    borderWidth: 1,
    borderColor: "#1D3A55",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  managementText: {
    flex: 1,
  },

  managementTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  managementDescription: {
    fontSize: 10,
    color: "#98A2B3",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#1C3040",
  },

  /* ACTIVITY */

  activityCard: {
    backgroundColor: "#102131",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  activityIcon: {
    width: 39,
    height: 39,
    borderRadius: 10,
    backgroundColor: "#0B1A28",
    borderWidth: 1,
    borderColor: "#1D3A55",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  activityText: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  activitySubtext: {
    fontSize: 9.5,
    color: "#98A2B3",
    marginTop: 3,
  },

  activityNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4D8DFF",
  },

  /* BOTTOM NAV */

  bottomNav: {
    position: "absolute",
    bottom: 3,
    left: 0,
    right: 0,
    height: 67,
    backgroundColor: "#102131",
    borderTopWidth: 1,
    borderTopColor: "#1C3040",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 10,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 55,
  },

  navText: {
    fontSize: 9,
    color: "#667085",
    marginTop: 4,
  },

  activeNavText: {
    color: "#4D8DFF",
    fontWeight: "700",
  },

  /* BOTTOM LINE */

  bottomLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#169BFF",
    zIndex: 20,
  },
});