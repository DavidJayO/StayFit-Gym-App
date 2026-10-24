import { createThemeStyles, useThemeMode } from "../lib/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Terms() {
  useThemeMode();
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Terms & Conditions
        </Text>

        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* Logo */}
        <Image
          source={require("../../assets/images/stayfit-logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Before You Continue
        </Text>

        <Text style={styles.subtitle}>
          Please read and agree to the following terms before
          creating your StayFit account.
        </Text>

        {/* Terms Card */}
        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            1. Membership
          </Text>

          <Text style={styles.text}>
            StayFit members must provide accurate information
            when creating an account. Membership benefits and
            access are based on the selected membership plan.
          </Text>

          <Text style={styles.sectionTitle}>
            2. Gym Rules
          </Text>

          <Text style={styles.text}>
            Members are expected to follow gym rules, respect
            staff and other members, and properly use gym
            equipment and facilities.
          </Text>

          <Text style={styles.sectionTitle}>
            3. Payments
          </Text>

          <Text style={styles.text}>
            All membership, daily pass, and class payments must
            be completed through the available payment options
            provided by StayFit.
          </Text>

          <Text style={styles.sectionTitle}>
            4. Class Booking
          </Text>

          <Text style={styles.text}>
            Members are responsible for their class reservations.
            Available slots are limited based on the capacity of
            each class.
          </Text>

          <Text style={styles.sectionTitle}>
            5. QR Access
          </Text>

          <Text style={styles.text}>
            A valid digital QR access pass may be required to
            enter the gym. Members must not share their QR pass
            with another person.
          </Text>

          <Text style={styles.sectionTitle}>
            6. Privacy
          </Text>

          <Text style={styles.text}>
            StayFit may collect information such as your name,
            email address, phone number, membership details,
            bookings, and attendance records to provide its
            services.
          </Text>

          <Text style={styles.sectionTitle}>
            7. Account Responsibility
          </Text>

          <Text style={styles.text}>
            Members are responsible for keeping their account
            information and password secure. Any suspicious
            account activity should be reported to the gym
            administrator.
          </Text>

          <Text style={styles.sectionTitle}>
            8. Agreement
          </Text>

          <Text style={styles.text}>
            By creating a StayFit account, you acknowledge that
            you have read, understood, and agreed to these Terms
            and Conditions and the Privacy Policy.
          </Text>

        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.agreementRow}
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
        >
          <View
            style={[
              styles.checkbox,
              agreed && styles.checkboxChecked,
            ]}
          >
            {agreed && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>

          <Text style={styles.agreementText}>
            I agree to the{" "}
            <Text style={styles.link}>
              Terms & Conditions
            </Text>{" "}
            and{" "}
            <Text style={styles.link}>
              Privacy Policy
            </Text>
            .
          </Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !agreed && styles.disabledButton,
          ]}
          disabled={!agreed}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.continueText}>
            CONTINUE TO REGISTER
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          StayFit Gym
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FC",
  },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7EC",
  },

  back: {
    color: "#155EEF",
    fontSize: 15,
    fontWeight: "700",
    width: 50,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#101828",
  },

  content: {
    paddingHorizontal: 22,
    paddingVertical: 25,
    paddingBottom: 35,
  },

  logo: {
    width: 150,
    height: 80,
    alignSelf: "center",
    marginBottom: 5,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
    marginTop: 5,
  },

  subtitle: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#155EEF",
    marginBottom: 6,
    marginTop: 5,
  },

  text: {
    fontSize: 12.5,
    color: "#475467",
    lineHeight: 19,
    marginBottom: 13,
  },

  agreementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    paddingHorizontal: 3,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#98A2B3",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: "#155EEF",
    borderColor: "#155EEF",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  agreementText: {
    flex: 1,
    fontSize: 12.5,
    color: "#475467",
    lineHeight: 19,
  },

  link: {
    color: "#155EEF",
    fontWeight: "700",
  },

  continueButton: {
    height: 53,
    backgroundColor: "#155EEF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  disabledButton: {
    backgroundColor: "#B2CCFF",
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  footer: {
    textAlign: "center",
    color: "#98A2B3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 25,
  },
});