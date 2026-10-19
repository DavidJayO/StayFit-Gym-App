import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactElement, ReactNode } from "react";
import { ActivityIndicator, RefreshControlProps, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const AdminColors = {
  background: "#06111C",
  panel: "#102131",
  panelDeep: "#0B1A28",
  border: "#1C3040",
  borderBright: "#1D3A55",
  blue: "#4D8DFF",
  blueStrong: "#1769FF",
  cyan: "#169BFF",
  text: "#FFFFFF",
  muted: "#98A2B3",
  dim: "#667085",
  green: "#1ED760",
  red: "#FF8585",
} as const;

export function AdminScreen({ title, children, scroll = true, backRoute = "/admin/dashboard", refreshControl }: { title: string; children: ReactNode; scroll?: boolean; backRoute?: string; refreshControl?: ReactElement<RefreshControlProps> }) {
  return (
    <SafeAreaView style={ui.container}>
      {scroll ? <ScrollView contentContainerStyle={ui.content} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View style={ui.header}><TouchableOpacity style={ui.backButton} onPress={() => router.replace(backRoute as never)}><Ionicons name="arrow-back" size={20} color={AdminColors.text} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={ui.eyebrow}>STAYFIT GYM · ADMIN</Text><Text style={ui.title}>{title}</Text></View></View>
        {children}
        <View style={{ height: 90 }} />
      </ScrollView> : children}
      <AdminBottomNav />
      <View style={ui.bottomLine} />
    </SafeAreaView>
  );
}

export function AdminBottomNav() {
  const items = [
    { label: "Home", icon: "home-outline" as const, route: "/admin/dashboard" },
    { label: "Members", icon: "people-outline" as const, route: "/admin/members" },
    { label: "Classes", icon: "calendar-outline" as const, route: "/admin/classes" },
    { label: "Payments", icon: "wallet-outline" as const, route: "/admin/payments" },
    { label: "More", icon: "menu-outline" as const, route: "/admin/settings" },
  ];
  return <View style={ui.bottomNav}>{items.map((item) => <TouchableOpacity key={item.label} style={ui.navItem} onPress={() => router.replace(item.route as never)}><Ionicons name={item.icon} size={20} color={AdminColors.dim} /><Text style={ui.navText}>{item.label}</Text></TouchableOpacity>)}</View>;
}

export function AdminSectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <View style={ui.sectionHeader}><Text style={ui.sectionTitle}>{children}</Text>{action}</View>;
}

export function AdminPanel({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[ui.panel, style]}>{children}</View>;
}

export function AdminMessage({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return <View style={[ui.message, tone === "info" && ui.infoMessage]}><Text style={[ui.messageText, tone === "info" && ui.infoMessageText]}>{children}</Text></View>;
}

export function AdminLoading() {
  return <View style={ui.loading}><ActivityIndicator color={AdminColors.blue} /><Text style={ui.loadingText}>Loading live gym data…</Text></View>;
}

export function AdminButton({ label, onPress, disabled, secondary = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={0.8} style={[ui.button, secondary && ui.secondaryButton, disabled && { opacity: 0.55 }]}><Text style={[ui.buttonText, secondary && ui.secondaryButtonText]}>{label}</Text></TouchableOpacity>;
}

const ui = StyleSheet.create({
  container: { flex: 1, backgroundColor: AdminColors.background },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: AdminColors.panel, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: AdminColors.border },
  eyebrow: { color: AdminColors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1, marginBottom: 3 },
  title: { color: AdminColors.text, fontSize: 21, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, marginTop: 20 },
  sectionTitle: { color: AdminColors.text, fontSize: 15, fontWeight: "800" },
  panel: { backgroundColor: AdminColors.panel, borderRadius: 12, borderWidth: 1, borderColor: AdminColors.border, padding: 14, marginBottom: 12 },
  message: { padding: 12, borderRadius: 10, backgroundColor: "#351B25", borderWidth: 1, borderColor: "#713344", marginBottom: 12 },
  infoMessage: { backgroundColor: AdminColors.panelDeep, borderColor: AdminColors.borderBright },
  messageText: { color: AdminColors.red, fontSize: 12, lineHeight: 18 },
  infoMessageText: { color: AdminColors.muted },
  loading: { padding: 30, alignItems: "center", gap: 10 },
  loadingText: { color: AdminColors.muted, fontSize: 12 },
  button: { minHeight: 42, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: AdminColors.blueStrong, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  buttonText: { color: AdminColors.text, fontSize: 12, fontWeight: "800" },
  secondaryButton: { backgroundColor: AdminColors.panelDeep, borderWidth: 1, borderColor: AdminColors.borderBright },
  secondaryButtonText: { color: AdminColors.blue },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 3, height: 67, backgroundColor: AdminColors.panel, borderTopWidth: 1, borderTopColor: AdminColors.border, flexDirection: "row", justifyContent: "space-around", alignItems: "center", zIndex: 10 },
  navItem: { alignItems: "center", justifyContent: "center", minWidth: 55 },
  navText: { color: AdminColors.dim, fontSize: 8, fontWeight: "600", marginTop: 4 },
  bottomLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: AdminColors.cyan, zIndex: 20 },
});
