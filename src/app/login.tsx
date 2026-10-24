import { createThemeStyles, useThemeMode } from "../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { signIn, type AppRole } from "../lib/auth";

export default function Login() {
  useThemeMode();
  const { signup } = useLocalSearchParams<{ signup?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async () => {
    // Check empty fields
    if (!email.trim() || !password) {
      Alert.alert(
        "Login Required",
        "Please enter your email and password."
      );
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Backend Not Configured", "Add your Supabase project URL and publishable key to the .env file, then restart Expo.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");
    try {
      const role = await signIn(email, password);
      if (role !== selectedRole) {
        const { supabase } = await import("../lib/supabase");
        await supabase.auth.signOut();
        setLoginError(
          role === "admin"
            ? "This account is an administrator account. Choose Admin to continue."
            : "This account is a member account. Choose Member to continue."
        );
        return;
      }
      router.replace(role === "admin" ? "/admin/dashboard" : "/member/dashboard");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Check your email and password, then try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Enter your email address first.");
      return;
    }
    if (!isSupabaseConfigured) {
      Alert.alert("Backend Not Configured", "Add your Supabase project URL and publishable key to the .env file, then restart Expo.");
      return;
    }
    try {
      const { supabase } = await import("../lib/supabase");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      Alert.alert(error ? "Reset Failed" : "Check Your Email", error?.message ?? "If an account exists, we sent a password reset link.");
    } catch {
      Alert.alert("Reset Failed", "Please try again when you have an internet connection.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* BACK BUTTON */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* LOGO */}

          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/stayfit-logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* TITLE */}

          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              {signup === "verify"
                ? "Account created. Verify your email, then log in."
                : signup === "success"
                  ? "Account created. Log in with your email and password."
                  : "Login to continue to StayFit"}
            </Text>
            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
          </View>

          <View style={styles.roleSelector} accessibilityRole="radiogroup">
            {(["member", "admin"] as const).map((role) => {
              const selected = selectedRole === role;
              return (
                <TouchableOpacity
                  key={role}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.roleOption, selected && styles.roleOptionSelected]}
                  onPress={() => {
                    setSelectedRole(role);
                    setLoginError("");
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={role === "admin" ? "shield-checkmark-outline" : "person-outline"}
                    size={17}
                    color={selected ? "#FFFFFF" : "#98A2B3"}
                  />
                  <Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>
                    {role === "admin" ? "Admin" : "Member"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LOGIN CARD */}

          <View style={styles.loginCard}>

            {/* EMAIL */}

            <Text style={styles.label}>
              Email Address
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={17}
                color="#667085"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#667085"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* PASSWORD */}

            <Text style={styles.label}>
              Password
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={17}
                color="#667085"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#667085"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(!showPassword)
                }
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-outline"
                      : "eye-off-outline"
                  }
                  size={17}
                  color="#667085"
                />
              </TouchableOpacity>
            </View>

            {/* FORGOT PASSWORD */}

            <TouchableOpacity
              style={styles.forgot}
              onPress={handlePasswordReset}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "SIGNING IN..." : "LOG IN"}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>

          </View>

          {/* REGISTER */}

          {selectedRole === "member" ? (
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push("/register")}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}> Create Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.adminNote}>
              Admin accounts are created by the gym administrator. Sign in with your assigned email and password.
            </Text>
          )}

          {/* BACKEND SETUP */}

          <View style={styles.demoCard}>

            <View style={styles.demoHeader}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#4D8DFF"
              />

              <Text style={styles.demoTitle}>
                Supabase Account
              </Text>
            </View>

            <Text style={styles.demoText}>
              Sign in with the email and password you registered with.
            </Text>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* BLUE BOTTOM LINE */}

      <View style={styles.bottomLine} />
    </SafeAreaView>
  );
}

const styles = createThemeStyles({
  container: {
    flex: 1,
    backgroundColor: "#06111C",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },

  /* BACK */

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#102131",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  /* LOGO */

  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },

  logo: {
    width: 150,
    height: 90,
  },

  /* TITLE */

  titleContainer: {
    alignItems: "center",
    marginBottom: 23,
  },

  roleSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  roleOption: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#24394A",
    backgroundColor: "#0B1A28",
  },

  roleOptionSelected: {
    borderColor: "#1769FF",
    backgroundColor: "#173B70",
  },

  roleOptionText: {
    color: "#98A2B3",
    fontSize: 12,
    fontWeight: "700",
  },

  roleOptionTextSelected: {
    color: "#FFFFFF",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#98A2B3",
    fontSize: 10,
    marginTop: 6,
  },

  errorText: {
    color: "#FF8585",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },

  /* LOGIN CARD */

  loginCard: {
    backgroundColor: "#102131",
    borderRadius: 14,
    padding: 17,
    borderWidth: 1,
    borderColor: "#1D3A55",
  },

  label: {
    color: "#D0D5DD",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
  },

  inputContainer: {
    height: 48,
    backgroundColor: "#0B1A28",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#24394A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    marginLeft: 9,
  },

  /* FORGOT */

  forgot: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 18,
  },

  forgotText: {
    color: "#4D8DFF",
    fontSize: 10,
    fontWeight: "700",
  },

  /* LOGIN */

  button: {
    height: 50,
    backgroundColor: "#1769FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* REGISTER */

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  registerText: {
    color: "#98A2B3",
    fontSize: 10,
  },

  registerLink: {
    color: "#4D8DFF",
    fontSize: 10,
    fontWeight: "800",
  },

  adminNote: {
    color: "#98A2B3",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 12,
  },

  /* DEMO */

  demoCard: {
    backgroundColor: "#102131",
    borderRadius: 10,
    padding: 13,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1C3040",
  },

  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  demoTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 6,
  },

  demoText: {
    color: "#98A2B3",
    fontSize: 9,
    marginTop: 3,
  },

  /* BOTTOM */

  bottomLine: {
    height: 3,
    backgroundColor: "#169BFF",
    width: "100%",
  },
});
