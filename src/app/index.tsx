import { createThemeStyles, useThemeMode } from "../lib/theme";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
  useThemeMode();
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!active || !user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (active && profile) {
        router.replace(profile.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/stayfit-logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* WELCOME */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>
            Welcome to StayFit
          </Text>

          <Text style={styles.subtitle}>
            Your fitness journey starts here.
          </Text>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonContainer}>

          {/* LOGIN */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>
              LOG IN
            </Text>
          </TouchableOpacity>

          {/* REGISTER */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
            activeOpacity={0.8}
          >
            <Text style={styles.registerText}>
              CREATE ACCOUNT
            </Text>
          </TouchableOpacity>

        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            STAYFIT GYM
          </Text>

          <Text style={styles.footerSubtext}>
            MEMBERSHIP • FITNESS • COMMUNITY
          </Text>
        </View>

      </View>

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

  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  /* LOGO */

  logoContainer: {
    alignItems: "center",
    marginBottom: 25,
  },

  logo: {
    width: 190,
    height: 120,
  },

  /* WELCOME */

  welcomeContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#98A2B3",
    fontSize: 11,
    textAlign: "center",
    marginTop: 7,
  },

  /* BUTTONS */

  buttonContainer: {
    width: "100%",
  },

  loginButton: {
    height: 52,
    backgroundColor: "#1769FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  registerButton: {
    height: 52,
    backgroundColor: "#102131",
    borderWidth: 1,
    borderColor: "#1769FF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  registerText: {
    color: "#4D8DFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    marginTop: 35,
  },

  footerText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },

  footerSubtext: {
    color: "#667085",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 5,
  },

  /* BOTTOM */

  bottomLine: {
    height: 3,
    width: "100%",
    backgroundColor: "#169BFF",
  },
});
