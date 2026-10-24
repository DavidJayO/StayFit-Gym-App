import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getThemePalette, setThemeMode, useThemeMode, type ThemeMode } from "../lib/theme";

export function ThemeSelector() {
  const mode = useThemeMode();
  const colors = getThemePalette(mode);

  return <View style={styles.wrap}>
    <View style={styles.headingRow}>
      <View style={[styles.iconWrap, { backgroundColor: mode === "dark" ? "#142C4A" : "#E8F0FC" }]}>
        <Ionicons name={mode === "dark" ? "moon-outline" : "sunny-outline"} size={18} color={colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Choose how StayFit Gym looks</Text>
      </View>
    </View>
    <View style={styles.options}>
      <ThemeOption mode={mode} value="dark" label="Dark mode" icon="moon-outline" />
      <ThemeOption mode={mode} value="light" label="Light mode" icon="sunny-outline" />
    </View>
  </View>;
}

function ThemeOption({ mode, value, label, icon }: { mode: ThemeMode; value: ThemeMode; label: string; icon: "moon-outline" | "sunny-outline" }) {
  const colors = getThemePalette(mode);
  const selected = mode === value;
  return <TouchableOpacity
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    onPress={() => { if (!selected) void setThemeMode(value); }}
    style={[styles.option, { backgroundColor: selected ? (mode === "dark" ? "#142C4A" : "#E8F0FC") : colors.panel, borderColor: selected ? colors.blue : colors.border }]}
  >
    <Ionicons name={icon} size={16} color={selected ? colors.blue : colors.muted} />
    <Text style={[styles.optionText, { color: colors.text }]}>{label}</Text>
    {selected ? <Ionicons name="checkmark-circle" size={16} color={colors.blue} /> : null}
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "transparent", paddingVertical: 10 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 12, fontWeight: "800" },
  subtitle: { fontSize: 9, marginTop: 3 },
  options: { flexDirection: "row", gap: 9 },
  option: { flex: 1, minHeight: 43, borderWidth: 1, borderRadius: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 8 },
  optionText: { fontSize: 9, fontWeight: "700" },
});
