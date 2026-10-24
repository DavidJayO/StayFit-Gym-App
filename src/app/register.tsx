import { createThemeStyles, useThemeMode } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { isSupabaseConfigured } from "../lib/supabase";
import { signUp } from "../lib/auth";

export default function Register() {
  useThemeMode();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Registration Required",
        "Please complete all fields."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );
      return;
    }

    if (!agreed) {
      Alert.alert(
        "Agreement Required",
        "Please agree to the Terms & Conditions and Privacy Policy."
      );
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Backend Not Configured", "Add your Supabase project URL and publishable key to the .env file, then restart Expo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({ fullName, email, phone, password });
      router.replace({
        pathname: "/login",
        params: { signup: result.needsEmailConfirmation ? "verify" : "success" },
      });
    } catch (error) {
      Alert.alert("Registration Failed", error instanceof Error ? error.message : "Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create Account</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/stayfit-logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Join StayFit</Text>

            <Text style={styles.subtitle}>
              Create your account and start your fitness journey.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#98A2B3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#667085"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#98A2B3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#667085"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PHONE NUMBER</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color="#98A2B3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#667085"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#98A2B3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#667085"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={19}
                    color="#98A2B3"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#98A2B3"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#667085"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={19}
                    color="#98A2B3"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Agreement */}
            <TouchableOpacity
              style={styles.agreementRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  agreed && styles.checkboxChecked,
                ]}
              >
                {agreed && (
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color="#FFFFFF"
                  />
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

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                !agreed && styles.disabledButton,
              ]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={isSubmitting || !agreed}
            >
              <Text style={styles.registerButtonText}>
                {isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.loginLink}> Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>STAYFIT GYM</Text>

            <Text style={styles.footerSubtext}>
              MEMBERSHIP • FITNESS • COMMUNITY
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Accent */}
      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

const styles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#06111C",
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  /* Header */

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#102131",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 40,
  },

  /* Logo */

  logoContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },

  logo: {
    width: 145,
    height: 85,
  },

  /* Title */

  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 5,
  },

  subtitle: {
    color: "#98A2B3",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 20,
  },

  /* Form */

  formCard: {
    backgroundColor: "#102131",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    color: "#98A2B3",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  inputContainer: {
    height: 48,
    borderRadius: 9,
    backgroundColor: "#0B1A28",
    borderWidth: 1,
    borderColor: "#1D3A55",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    marginLeft: 10,
  },

  /* Agreement */

  agreementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 17,
  },

  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#667085",
    backgroundColor: "#0B1A28",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  checkboxChecked: {
    backgroundColor: "#1769FF",
    borderColor: "#1769FF",
  },

  agreementText: {
    flex: 1,
    color: "#98A2B3",
    fontSize: 10.5,
    lineHeight: 17,
  },

  link: {
    color: "#4D8DFF",
    fontWeight: "700",
  },

  /* Button */

  registerButton: {
    height: 50,
    borderRadius: 9,
    backgroundColor: "#1769FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  disabledButton: {
    backgroundColor: "#315A91",
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* Login */

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#98A2B3",
    fontSize: 11,
  },

  loginLink: {
    color: "#4D8DFF",
    fontSize: 11,
    fontWeight: "800",
  },

  /* Footer */

  footer: {
    alignItems: "center",
    marginTop: 25,
  },

  footerText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  footerSubtext: {
    color: "#667085",
    fontSize: 8,
    marginTop: 4,
    letterSpacing: 0.5,
  },

  bottomLine: {
    height: 3,
    backgroundColor: "#169BFF",
  },
});
