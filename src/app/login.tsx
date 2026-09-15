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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Check empty fields
    if (!email.trim() || !password) {
      Alert.alert(
        "Login Required",
        "Please enter your email and password."
      );
      return;
    }

    const userEmail = email.trim().toLowerCase();

    // =========================
    // ADMIN LOGIN
    // =========================
    if (
      userEmail === "admin@stayfit.com" &&
      password === "admin123"
    ) {
      router.replace("/admin/dashboard");
      return;
    }

    // =========================
    // MEMBER LOGIN
    // =========================
    if (
      userEmail === "member@stayfit.com" &&
      password === "member123"
    ) {
      router.replace("/member/dashboard");
      return;
    }

    // =========================
    // INVALID LOGIN
    // =========================
    Alert.alert(
      "Login Failed",
      "Invalid email or password."
    );
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
              Login to continue to StayFit
            </Text>
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
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                LOG IN
              </Text>

              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>

          </View>

          {/* REGISTER */}

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>
              Don't have an account?
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/register")}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>
                {" "}Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* DEMO ACCOUNT */}

          <View style={styles.demoCard}>

            <View style={styles.demoHeader}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#4D8DFF"
              />

              <Text style={styles.demoTitle}>
                Demo Login
              </Text>
            </View>

            <Text style={styles.demoText}>
              Member: member@stayfit.com
            </Text>

            <Text style={styles.demoText}>
              Password: member123
            </Text>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

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