
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const BLUE = "#1769FF";

const categories = ["All", "Strength", "Cardio", "HIIT", "Yoga"];

const initialClasses = [
  {
    id: "1",
    name: "Full Body Workout",
    category: "Strength",
    trainer: "Coach Michael",
    time: "5:00 PM - 6:00 PM",
    duration: "60 min",
    booked: 12,
    capacity: 20,
    icon: "barbell-outline" as const,
  },
  {
    id: "2",
    name: "HIIT Training",
    category: "HIIT",
    trainer: "Coach Sarah",
    time: "6:30 PM - 7:15 PM",
    duration: "45 min",
    booked: 18,
    capacity: 20,
    icon: "flash-outline" as const,
  },
  {
    id: "3",
    name: "Cardio Burn",
    category: "Cardio",
    trainer: "Coach Alex",
    time: "7:30 AM - 8:15 AM",
    duration: "45 min",
    booked: 8,
    capacity: 15,
    icon: "heart-outline" as const,
  },
  {
    id: "4",
    name: "Morning Yoga",
    category: "Yoga",
    trainer: "Coach Angela",
    time: "8:30 AM - 9:15 AM",
    duration: "45 min",
    booked: 6,
    capacity: 15,
    icon: "leaf-outline" as const,
  },
];

export default function Classes() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [bookedClasses, setBookedClasses] = useState<string[]>([]);

  const filteredClasses =
    selectedCategory === "All"
      ? initialClasses
      : initialClasses.filter(
          (item) => item.category === selectedCategory
        );

  const handleBooking = (id: string, name: string) => {
    if (bookedClasses.includes(id)) {
      Alert.alert(
        "Already Booked",
        "You have already booked this class."
      );
      return;
    }

    const gymClass = initialClasses.find((item) => item.id === id);

    if (!gymClass || gymClass.booked >= gymClass.capacity) {
      Alert.alert("Class Full", "There are no available slots.");
      return;
    }

    Alert.alert(
      "Confirm Booking",
      `Would you like to book ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setBookedClasses((current) => [...current, id]);
            Alert.alert(
              "Booking Successful",
              `${name} has been added to your temporary bookings.`
            );
          },
        },
      ]
    );
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

        <Text style={styles.headerTitle}>Classes</Text>

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
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>STAYFIT GYM</Text>
          <Text style={styles.title}>Find Your Class</Text>
          <Text style={styles.subtitle}>
            Train your way. Get stronger every day.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="calendar-outline" size={24} color="#4D8DFF" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Group Training</Text>
            <Text style={styles.summarySubtitle}>
              Explore classes and reserve your spot.
            </Text>
          </View>
          <Ionicons name="fitness-outline" size={25} color="#4D8DFF" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category) => {
            const active = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  active && styles.categoryActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Classes</Text>
          <Text style={styles.count}>{filteredClasses.length} classes</Text>
        </View>

        {filteredClasses.map((item) => {
          const isBooked = bookedClasses.includes(item.id);
          const remaining = item.capacity - item.booked;

          return (
            <View key={item.id} style={styles.classCard}>
              <View style={styles.cardTop}>
                <View style={styles.classIcon}>
                  <Ionicons
                    name={item.icon}
                    size={25}
                    color="#4D8DFF"
                  />
                </View>

                <View style={styles.classInfo}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.trainer}>{item.trainer}</Text>
                </View>

                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.detailRow}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color="#4D8DFF"
                />
                <Text style={styles.detailText}>{item.time}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="people-outline"
                  size={17}
                  color="#4D8DFF"
                />
                <Text style={styles.detailText}>
                  {item.booked}/{item.capacity} spots booked
                </Text>
                <View style={styles.spacer} />
                <Text
                  style={[
                    styles.slotsText,
                    remaining <= 3 && styles.limitedText,
                  ]}
                >
                  {remaining > 0 ? `${remaining} left` : "Full"}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(item.booked / item.capacity) * 100}%` },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.bookButton,
                  (isBooked || remaining === 0) && styles.bookedButton,
                ]}
                disabled={remaining === 0}
                onPress={() => handleBooking(item.id, item.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.bookButtonText}>
                  {isBooked
                    ? "BOOKED"
                    : remaining === 0
                    ? "CLASS FULL"
                    : "BOOK NOW"}
                </Text>
                {!isBooked && remaining > 0 && (
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#FFFFFF"
                  />
                )}
                {isBooked && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#54D98C"
                  />
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.myBookingsButton}
          onPress={() => router.push("/member/bookings")}
        >
          <Ionicons name="calendar" size={19} color="#4D8DFF" />
          <Text style={styles.myBookingsText}>View My Bookings</Text>
          <Ionicons
            name="chevron-forward"
            size={19}
            color="#98A2B3"
          />
        </TouchableOpacity>

        <Text style={styles.footerText}>
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
          icon="barbell"
          label="Classes"
          active
          onPress={() => {}}
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
  active = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon}
        size={21}
        color={active ? "#4D8DFF" : "#98A2B3"}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06111C",
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#102131",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 25,
  },
  intro: {
    marginBottom: 20,
  },
  eyebrow: {
    color: "#4D8DFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 7,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
  },
  subtitle: {
    color: "#98A2B3",
    fontSize: 12,
    marginTop: 6,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#1C3040",
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#142C4A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  summarySubtitle: {
    color: "#98A2B3",
    fontSize: 10,
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  categoryList: {
    gap: 9,
    paddingBottom: 25,
  },
  categoryButton: {
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#24394A",
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 10,
  },
  categoryActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  categoryText: {
    color: "#98A2B3",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  count: {
    color: "#98A2B3",
    fontSize: 11,
  },
  classCard: {
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#1C3040",
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  classIcon: {
    width: 47,
    height: 47,
    backgroundColor: "#142C4A",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  trainer: {
    color: "#98A2B3",
    fontSize: 11,
    marginTop: 5,
  },
  durationBadge: {
    backgroundColor: "#0B1A28",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
  },
  durationText: {
    color: "#D0D5DD",
    fontSize: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#24394A",
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  detailText: {
    color: "#D0D5DD",
    fontSize: 11,
  },
  spacer: {
    flex: 1,
  },
  slotsText: {
    color: "#54D98C",
    fontSize: 10,
    fontWeight: "700",
  },
  limitedText: {
    color: "#F0B45A",
  },
  progressTrack: {
    height: 4,
    borderRadius: 5,
    backgroundColor: "#24394A",
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: BLUE,
    borderRadius: 5,
  },
  bookButton: {
    height: 44,
    backgroundColor: BLUE,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bookedButton: {
    backgroundColor: "#123D2A",
    borderWidth: 1,
    borderColor: "#1B6340",
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  myBookingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#1C3040",
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
  },
  myBookingsText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  footerText: {
    color: "#667085",
    fontSize: 9,
    textAlign: "center",
    marginTop: 25,
    letterSpacing: 0.7,
  },
  bottomNav: {
    height: 65,
    flexDirection: "row",
    backgroundColor: "#0B1A28",
    borderTopWidth: 1,
    borderTopColor: "#1C3040",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navLabel: {
    color: "#98A2B3",
    fontSize: 9,
  },
  navLabelActive: {
    color: "#4D8DFF",
    fontWeight: "700",
  },
  bottomLine: {
    height: 3,
    backgroundColor: "#169BFF",
  },
});
