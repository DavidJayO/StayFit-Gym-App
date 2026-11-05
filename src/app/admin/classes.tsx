import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdminButton, AdminLoading, AdminMessage, AdminPanel, AdminScreen, AdminSectionTitle, AdminColors as C } from "../../components/admin-ui";
import { createGymClass, errorMessage, formatAdminTime, loadAdminBookings, loadAdminClasses, setAdminBookingStatus, setGymClassActive } from "../../lib/admin-data";

const initialForm = { name: "", category: "", trainer: "", startsAt: "", duration: "60", capacity: "20" };

export default function AdminClasses() {
  useThemeMode();
  const [classes, setClasses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDraft, setPickerDraft] = useState(new Date());
  const [expandedClassId, setExpandedClassId] = useState("");
  const [busyBookingId, setBusyBookingId] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [classRows, bookingRows] = await Promise.all([loadAdminClasses(), loadAdminBookings()]);
      setClasses(classRows);
      setBookings(bookingRows);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function openStartDatePicker() {
    const current = form.startsAt ? new Date(form.startsAt) : new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        minimumDate: new Date(),
        onValueChange: (_event, selectedDate) => {
          const dateValue = new Date(current);
          dateValue.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          DateTimePickerAndroid.open({
            value: dateValue,
            mode: "time",
            is24Hour: false,
            onValueChange: (_timeEvent, selectedTime) => {
              dateValue.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              setForm((previous) => ({ ...previous, startsAt: dateValue.toISOString() }));
            },
          });
        },
      });
      return;
    }

    setPickerDraft(current);
    setPickerVisible(true);
  }

  async function submit() {
    setError("");
    const startsAt = form.startsAt ? new Date(form.startsAt) : null;
    const duration = Number(form.duration);
    const capacity = Number(form.capacity);
    if (!form.name.trim() || !form.category.trim() || !form.trainer.trim() || !startsAt || Number.isNaN(startsAt.getTime()) || duration < 1 || capacity < 1) {
      setError("Enter all class details and choose a valid start date and time."); return;
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

  async function updateBooking(bookingId: string, status: "approved" | "rejected" | "cancelled") {
    setBusyBookingId(bookingId);
    setError("");
    try {
      await setAdminBookingStatus(bookingId, status);
      setBookings(await loadAdminBookings());
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusyBookingId(""); }
  }

  return <AdminScreen title="Classes">
    <AdminSectionTitle>Schedule a class</AdminSectionTitle>
    <AdminPanel>
      <Field label="Class name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Full Body Workout" />
      <Field label="Category" value={form.category} onChangeText={(category) => setForm({ ...form, category })} placeholder="Strength" />
      <Field label="Trainer" value={form.trainer} onChangeText={(trainer) => setForm({ ...form, trainer })} placeholder="Trainer name" />
      <View style={styles.field}>
        <Text style={styles.label}>Start date and time</Text>
        {Platform.OS === "web" ? <WebDateTimeInput
          value={form.startsAt ? toLocalDateTimeInputValue(new Date(form.startsAt)) : ""}
          onChange={(value) => setForm((previous) => ({ ...previous, startsAt: value ? new Date(value).toISOString() : "" }))}
          disabled={saving}
        /> : <TouchableOpacity style={styles.dateTimeButton} onPress={openStartDatePicker} disabled={saving} accessibilityRole="button" accessibilityLabel="Select class start date and time">
            <Ionicons name="calendar-outline" size={17} color={C.blue} />
            <Text style={[styles.dateTimeText, !form.startsAt && styles.dateTimePlaceholder]}>
              {form.startsAt ? new Date(form.startsAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) : "Select date and time"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={C.muted} />
          </TouchableOpacity>}
      </View>
      <View style={styles.numberRow}><View style={{ flex: 1 }}><Field label="Duration (min)" value={form.duration} onChangeText={(duration) => setForm({ ...form, duration })} keyboardType="number-pad" placeholder="60" /></View><View style={{ flex: 1 }}><Field label="Capacity" value={form.capacity} onChangeText={(capacity) => setForm({ ...form, capacity })} keyboardType="number-pad" placeholder="20" /></View></View>
      <AdminButton label={saving ? "Saving…" : "Add class"} onPress={() => void submit()} disabled={saving} />
    </AdminPanel>
    {Platform.OS === "ios" ? <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.pickerPanel}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setPickerVisible(false)}><Text style={styles.pickerAction}>Cancel</Text></TouchableOpacity>
            <Text style={styles.pickerTitle}>Class start</Text>
            <TouchableOpacity onPress={() => { setForm((previous) => ({ ...previous, startsAt: pickerDraft.toISOString() })); setPickerVisible(false); }}><Text style={styles.pickerAction}>Done</Text></TouchableOpacity>
          </View>
          <DateTimePicker value={pickerDraft} mode="datetime" display="spinner" minimumDate={new Date()} onValueChange={(_event, date) => setPickerDraft(date)} />
        </View>
      </View>
    </Modal> : null}
    {error ? <AdminMessage>{error}</AdminMessage> : null}
    <AdminSectionTitle>Class schedule</AdminSectionTitle>
    {loading && classes.length === 0 ? <AdminLoading /> : classes.length === 0 ? <AdminPanel><Text style={styles.muted}>No classes found. Create the first schedule above.</Text></AdminPanel> : classes.map((item) => {
      const classBookings = bookings.filter((booking) => booking.class_id === item.id && ["pending", "approved"].includes(booking.status));
      const isExpanded = expandedClassId === item.id;
      return <AdminPanel key={item.id} style={styles.classCard}>
        <View style={styles.classHeader}><View style={styles.icon}><Ionicons name="fitness-outline" size={19} color={C.blue} /></View><View style={{ flex: 1 }}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.category} · {item.trainer_name}</Text></View><Text style={[styles.status, item.is_active ? styles.live : styles.off]}>{item.is_active ? "ACTIVE" : "HIDDEN"}</Text></View>
        <Text style={styles.meta}>{formatAdminTime(item.starts_at)} · {item.duration_minutes} min · Capacity {item.capacity}</Text>
        <TouchableOpacity style={styles.toggle} onPress={() => void toggleClass(item)}><Text style={styles.toggleText}>{item.is_active ? "Hide from members" : "Show to members"}</Text><Ionicons name="chevron-forward" size={15} color={C.blue} /></TouchableOpacity>
        <TouchableOpacity style={styles.membersToggle} onPress={() => setExpandedClassId(isExpanded ? "" : item.id)} accessibilityRole="button">
          <Text style={styles.toggleText}>{isExpanded ? "Hide members" : `View members (${classBookings.length})`}</Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={15} color={C.blue} />
        </TouchableOpacity>
        {isExpanded ? <View style={styles.memberList}>
          {classBookings.length === 0 ? <Text style={styles.muted}>No members have booked this class yet.</Text> : classBookings.map((booking) => {
            const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
            return <View key={booking.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{profile?.full_name || "Member"}</Text>
                {profile?.email ? <Text style={styles.meta}>{profile.email}</Text> : null}
                <Text style={styles.meta}>Requested {formatAdminTime(booking.created_at)}</Text>
              </View>
              <View style={styles.memberActions}>
                <Text style={[styles.bookingState, booking.status === "approved" ? styles.live : booking.status === "pending" ? styles.pending : styles.off]}>{String(booking.status).toUpperCase()}</Text>
                {booking.status === "pending" ? <>
                  <TouchableOpacity disabled={busyBookingId === booking.id} onPress={() => void updateBooking(booking.id, "rejected")}><Text style={styles.rejectAction}>{busyBookingId === booking.id ? "Saving…" : "Reject"}</Text></TouchableOpacity>
                  <TouchableOpacity disabled={busyBookingId === booking.id} onPress={() => void updateBooking(booking.id, "approved")}><Text style={styles.approveAction}>{busyBookingId === booking.id ? "Saving…" : "Approve"}</Text></TouchableOpacity>
                </> : booking.status === "approved" ? <TouchableOpacity disabled={busyBookingId === booking.id} onPress={() => void updateBooking(booking.id, "cancelled")}><Text style={styles.rejectAction}>{busyBookingId === booking.id ? "Saving…" : "Cancel"}</Text></TouchableOpacity> : null}
              </View>
            </View>;
          })}
        </View> : null}
      </AdminPanel>;
    })}
  </AdminScreen>;
}

function toLocalDateTimeInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function WebDateTimeInput(props: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  return React.createElement("input" as any, {
    type: "datetime-local",
    value: props.value,
    min: toLocalDateTimeInputValue(new Date()),
    disabled: props.disabled,
    "aria-label": "Select class start date and time",
    onChange: (event: { currentTarget: { value: string } }) => props.onChange(event.currentTarget.value),
    style: {
      boxSizing: "border-box",
      width: "100%",
      minHeight: 42,
      backgroundColor: C.panelDeep,
      border: `1px solid ${C.border}`,
      borderRadius: 9,
      padding: "0 10px",
      color: C.text,
      colorScheme: "dark",
      fontSize: 11,
    },
  });
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "number-pad" }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor={C.dim} keyboardType={props.keyboardType ?? "default"} autoCapitalize="sentences" style={styles.input} /></View>;
}

const styles = createThemeStyles({
  field: { marginBottom: 11 },
  label: { color: "#D0D5DD", fontSize: 9, fontWeight: "700", marginBottom: 5 },
  input: { minHeight: 42, backgroundColor: C.panelDeep, borderColor: C.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, color: C.text, fontSize: 11 },
  dateTimeButton: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.panelDeep, borderColor: C.border, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10 },
  dateTimeText: { flex: 1, color: C.text, fontSize: 11 },
  dateTimePlaceholder: { color: C.dim },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  pickerPanel: { backgroundColor: C.panel, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 20 },
  pickerHeader: { minHeight: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerTitle: { color: C.text, fontSize: 12, fontWeight: "700" },
  pickerAction: { color: C.blue, fontSize: 12, fontWeight: "700" },
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
  membersToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 10 },
  memberList: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 4 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  memberInfo: { flex: 1 },
  memberName: { color: C.text, fontSize: 10, fontWeight: "700" },
  memberActions: { flexDirection: "row", alignItems: "center", gap: 9, flexWrap: "wrap", justifyContent: "flex-end" },
  bookingState: { fontSize: 7, fontWeight: "800", paddingHorizontal: 7, paddingVertical: 5, borderRadius: 10, overflow: "hidden" },
  pending: { color: "#F4C95D", backgroundColor: "#40351D" },
  rejectAction: { color: C.red, fontSize: 9, fontWeight: "700" },
  approveAction: { color: C.blue, fontSize: 9, fontWeight: "700" },
  toggleText: { color: C.blue, fontSize: 10, fontWeight: "700" },
  muted: { color: C.muted, fontSize: 11 },
});
