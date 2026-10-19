import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdminButton, AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { createGymClass, errorMessage, formatAdminTime, loadAdminClasses, setGymClassActive } from "../../lib/admin-data";

const initialForm = { name: "", category: "", trainer: "", startsAt: "", duration: "60", capacity: "20" };

export default function AdminClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setClasses(await loadAdminClasses()); } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit() {
    setError("");
    const startsAt = new Date(form.startsAt);
    const duration = Number(form.duration);
    const capacity = Number(form.capacity);
    if (!form.name.trim() || !form.category.trim() || !form.trainer.trim() || !form.startsAt.trim() || Number.isNaN(startsAt.getTime()) || duration < 1 || capacity < 1) {
      setError("Enter all class details. Use a valid date and time, for example 2026-10-25T18:00:00+08:00."); return;
    }
    setSaving(true);
    try { await createGymClass({ name: form.name, category: form.category, trainer: form.trainer, startsAt: startsAt.toISOString(), duration, capacity }); setForm(initialForm); await load(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  }

  async function toggleClass(item: any) {
    try { await setGymClassActive(item.id, !item.is_active); await load(); }
    catch (e) { setError(errorMessage(e)); }
  }

  return <AdminScreen title="Classes">
    <AdminSectionTitle>Schedule a class</AdminSectionTitle>
    <AdminPanel>
      <Field label="Class name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Full Body Workout" />
      <Field label="Category" value={form.category} onChangeText={(category) => setForm({ ...form, category })} placeholder="Strength" />
      <Field label="Trainer" value={form.trainer} onChangeText={(trainer) => setForm({ ...form, trainer })} placeholder="Trainer name" />
      <Field label="Start date and time" value={form.startsAt} onChangeText={(startsAt) => setForm({ ...form, startsAt })} placeholder="2026-10-25T18:00:00+08:00" />
      <View style={styles.numberRow}><View style={{ flex: 1 }}><Field label="Duration (min)" value={form.duration} onChangeText={(duration) => setForm({ ...form, duration })} keyboardType="number-pad" placeholder="60" /></View><View style={{ flex: 1 }}><Field label="Capacity" value={form.capacity} onChangeText={(capacity) => setForm({ ...form, capacity })} keyboardType="number-pad" placeholder="20" /></View></View>
      <AdminButton label={saving ? "Saving…" : "Add class"} onPress={() => void submit()} disabled={saving} />
    </AdminPanel>
    {error ? <AdminMessage>{error}</AdminMessage> : null}
    <AdminSectionTitle>Class schedule</AdminSectionTitle>
    {loading && classes.length === 0 ? <AdminLoading /> : classes.length === 0 ? <AdminPanel><Text style={styles.muted}>No classes found. Create the first schedule above.</Text></AdminPanel> : classes.map((item) => <AdminPanel key={item.id} style={styles.classCard}>
      <View style={styles.classHeader}><View style={styles.icon}><Ionicons name="fitness-outline" size={19} color={C.blue} /></View><View style={{ flex: 1 }}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.category} · {item.trainer_name}</Text></View><Text style={[styles.status, item.is_active ? styles.live : styles.off]}>{item.is_active ? "ACTIVE" : "HIDDEN"}</Text></View>
      <Text style={styles.meta}>{formatAdminTime(item.starts_at)} · {item.duration_minutes} min · Capacity {item.capacity}</Text>
      <TouchableOpacity style={styles.toggle} onPress={() => void toggleClass(item)}><Text style={styles.toggleText}>{item.is_active ? "Hide from members" : "Show to members"}</Text><Ionicons name="chevron-forward" size={15} color={C.blue} /></TouchableOpacity>
    </AdminPanel>)}
  </AdminScreen>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "number-pad" }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={C.dim} keyboardType={props.keyboardType ?? "default"} autoCapitalize="sentences" style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  field: { marginBottom: 11 },
  label: { color: "#D0D5DD", fontSize: 9, fontWeight: "700", marginBottom: 5 },
  input: { minHeight: 42, backgroundColor: C.panelDeep, borderColor: C.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, color: C.text, fontSize: 11 },
  numberRow: { flexDirection: "row", gap: 10 },
  classCard: { marginBottom: 9 },
  classHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  icon: { width: 38, height: 38, backgroundColor: C.panelDeep, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 10 },
  name: { color: C.text, fontSize: 12, fontWeight: "800" },
  meta: { color: C.muted, fontSize: 9, marginTop: 4 },
  status: { fontSize: 7, fontWeight: "800", paddingVertical: 5, paddingHorizontal: 7, borderRadius: 12, overflow: "hidden" },
  live: { color: C.green, backgroundColor: "#123D2A" },
  off: { color: C.muted, backgroundColor: C.panelDeep },
  toggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 10 },
  toggleText: { color: C.blue, fontSize: 10, fontWeight: "700" },
  muted: { color: C.muted, fontSize: 11 },
});
