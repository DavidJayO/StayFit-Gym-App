import { createThemeStyles, useThemeMode } from "../../lib/theme";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import QRCode from "react-native-qrcode-svg";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import {
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { currentUserId, loadProfile, getErrorMessage } from "../../lib/member-data";

const BLUE = "#1769FF";

type DailyPassRecord = { id: string; visit_on: string; visit_time: string; status: string; payment_method: string; payment_status: string; access_token: string | null; checked_in_at: string | null; paypal_invoice_id: string | null; paypal_invoice_url: string | null };
const localIsoDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const localTime = (date = new Date()) => String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
const toLocalDateTimeInputValue = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const timeLabel = (time: string) => { const parts = time.split(":").map(Number); const date = new Date(); date.setHours(parts[0], parts[1], 0, 0); return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
const defaultVisitDateTime = () => {
  const date = new Date();
  date.setMinutes(Math.ceil((date.getMinutes() + 30) / 15) * 15, 0, 0);
  return date;
};
const initialVisitDateTime = defaultVisitDateTime();

export default function DailyPass() {
  useThemeMode();
  const [visitTime, setVisitTime] = useState(() => localTime(initialVisitDateTime));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDraft, setPickerDraft] = useState(() => initialVisitDateTime);
  const [visitDate, setVisitDate] = useState(() => localIsoDate(initialVisitDateTime));
  const [paymentMethod, setPaymentMethod] = useState("PayPal");
  const [fullName, setFullName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [latestRequest, setLatestRequest] = useState("");
  const [latestPass, setLatestPass] = useState<DailyPassRecord | null>(null);

  const refreshPassStatus = async () => {
    try {
      const userId = await currentUserId();
      const { data, error } = await supabase.from("daily_pass_requests").select("id,status,visit_on,visit_time,payment_method,payment_status,access_token,checked_in_at,paypal_invoice_id,paypal_invoice_url").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      setLatestPass(data as DailyPassRecord | null);
      if (data) setLatestRequest(`Latest request: ${data.status.toUpperCase()} · visit ${data.visit_on} at ${timeLabel(data.visit_time)} · payment ${data.payment_status.toUpperCase()}`);
    } catch (e) { Alert.alert("Pass status unavailable", getErrorMessage(e)); }
  };

  const startPaypalCheckout = async (request: DailyPassRecord) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-daily-pass-paypal-invoice", { body: { request_id: request.id } });
      if (error) {
        const responseBody = await (error as any).context?.clone?.().json?.().catch(() => null);
        throw new Error(responseBody?.error || error.message);
      }
      if (data?.error) throw new Error(data.error);
      const invoiceUrl = data?.invoice_url ?? request.paypal_invoice_url;
      setLatestPass((current) => current?.id === request.id ? { ...current, payment_status: "submitted", paypal_invoice_id: data?.invoice_id ?? current.paypal_invoice_id, paypal_invoice_url: invoiceUrl } : current);
      setLatestRequest(`Latest request: PENDING · visit ${request.visit_on} at ${timeLabel(request.visit_time)} · PayPal payment submitted`);
      if (!invoiceUrl) throw new Error("PayPal checkout link is not available yet. Refresh the pass and try again.");
      await WebBrowser.openBrowserAsync(invoiceUrl);
    } catch (e) { Alert.alert("Could not start PayPal checkout", getErrorMessage(e)); }
  };

  useEffect(() => { void (async () => {
    try {
      const [profile, userId] = await Promise.all([loadProfile(), currentUserId()]);
      setFullName(profile.full_name);
      const { data, error } = await supabase.from("daily_pass_requests").select("id,status,visit_on,visit_time,payment_method,payment_status,access_token,checked_in_at,paypal_invoice_id,paypal_invoice_url").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        setLatestPass(data as DailyPassRecord);
        setLatestRequest(`Latest request: ${data.status.toUpperCase()} · visit ${data.visit_on} at ${timeLabel(data.visit_time)} · payment ${data.payment_status.toUpperCase()}`);
      }
    } catch (e) { Alert.alert("Member data unavailable", getErrorMessage(e)); }
  })(); }, []);

  function openVisitDateTimePicker() {
    const current = new Date(visitDate + "T" + visitTime + ":00");
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        minimumDate: new Date(),
        onValueChange: (_event, selectedDate) => {
          const next = new Date(current);
          next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          DateTimePickerAndroid.open({
            value: next,
            mode: "time",
            is24Hour: false,
            onValueChange: (_timeEvent, selectedTime) => {
              next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
              setVisitDate(localIsoDate(next));
              setVisitTime(localTime(next));
            },
          });
        },
      });
      return;
    }
    setPickerDraft(current);
    setPickerVisible(true);
  }

  const handlePurchase = async () => {
    if (!visitDate.trim()) {
      Alert.alert("Required Fields", "Please enter your visit date.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
      Alert.alert("Invalid Date", "Use the YYYY-MM-DD date format.");
      return;
    }

    const selected = new Date(`${visitDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selected.getTime()) || selected < today) {
      Alert.alert("Invalid Date", "Choose today or a future visit date.");
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(visitTime)) {
      Alert.alert("Invalid Time", "Choose a valid visit time.");
      return;
    }
    if (visitDate === localIsoDate() && visitTime < localTime()) {
      Alert.alert("Invalid Time", "For today, choose a time that has not passed.");
      return;
    }

    try {
      const userId = await currentUserId();
      const { data, error } = await supabase.from("daily_pass_requests").insert({ user_id: userId, visit_on: visitDate, visit_time: visitTime, payment_method: paymentMethod }).select("id,status,visit_on,visit_time,payment_method,payment_status,access_token,checked_in_at,paypal_invoice_id,paypal_invoice_url").single();
      if (error) throw error;
      setLatestPass(data as DailyPassRecord);
      setSubmitted(true);
      setLatestRequest(`Latest request: PENDING · visit ${visitDate} at ${timeLabel(visitTime)} · payment PENDING`);
      if (paymentMethod === "PayPal") await startPaypalCheckout(data as DailyPassRecord);
      else Alert.alert("Request submitted", "Your daily pass request is saved. Staff must approve it and record your cash payment before the entry QR becomes available.");
    } catch (e) { Alert.alert("Request failed", getErrorMessage(e)); }
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

        <Text style={styles.headerTitle}>Daily Pass</Text>

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
        <Text style={styles.eyebrow}>STAYFIT GYM</Text>
        <Text style={styles.title}>Day Pass</Text>
        <Text style={styles.subtitle}>
          Enjoy a full day of training without a monthly membership.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="fitness-outline" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.planLabel}>SINGLE-DAY ACCESS</Text>
          <Text style={styles.price}>₱150<Text style={styles.priceDecimal}>.00</Text></Text>
          <Text style={styles.priceCaption}>One-day gym visit · ₱150.00</Text>

          <View style={styles.heroDivider} />

          {[
            "Access to gym facilities for one day",
            "Use of standard workout equipment",
            "Staff assistance during your visit",
          ].map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#54D98C"
              />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#4D8DFF"
          />
          <Text style={styles.noticeText}>
            {paymentMethod === "PayPal" ? "PayPal opens its secure hosted checkout. The admin verifies payment and approves the pass before the entry QR is issued." : "Submit the request for staff approval. Pay cash at the gym; staff records payment before issuing the entry QR."}
          </Text>
        </View>

        {latestPass ? <View style={styles.accessCard}>
          <Text style={styles.sectionTitle}>Entry Pass</Text>
          {latestPass.status !== "approved" ? <Text style={styles.accessMessage}>{latestPass.payment_method === "PayPal" && latestPass.payment_status === "submitted" ? "Your PayPal payment is awaiting admin verification." : `Your request is ${latestPass.status}. The entry QR appears after staff approves the request and records payment.`}</Text>
            : latestPass.payment_status !== "paid" ? <Text style={styles.accessMessage}>Approved for {latestPass.visit_on}. The entry QR will appear after staff confirms your payment.</Text>
            : latestPass.checked_in_at ? <View style={styles.checkedIn}><Ionicons name="checkmark-circle" size={20} color="#54D98C" /><Text style={styles.accessMessage}>This pass was already used for entry.</Text></View>
            : latestPass.visit_on < localIsoDate() ? <Text style={styles.accessMessage}>This daily pass has expired. Submit a new request for another visit.</Text>
            : latestPass.visit_on !== localIsoDate() ? <Text style={styles.accessMessage}>Your pass is paid and approved for {latestPass.visit_on}. The entry QR will be available on that visit date.</Text>
            : latestPass.access_token ? <>
              <View style={styles.qrCard}><QRCode value={`STAYFIT-DAYPASS:${latestPass.access_token}`} size={210} backgroundColor="#FFFFFF" color="#06111C" /></View>
              <Text style={styles.qrCaption}>Show this entry QR to gym staff on {latestPass.visit_on} (planned arrival {timeLabel(latestPass.visit_time)}). It can be scanned once.</Text>
            </> : <Text style={styles.accessMessage}>Your entry pass is being prepared. Refresh this page shortly.</Text>}
          <TouchableOpacity style={styles.refreshPass} onPress={() => void refreshPassStatus()}><Ionicons name="refresh-outline" size={15} color="#4D8DFF" /><Text style={styles.refreshPassText}>Refresh pass status</Text></TouchableOpacity>
        </View> : null}

        <Text style={styles.sectionTitle}>Pass Details</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>ACCOUNT</Text>
          <Text style={styles.input}>{fullName || "Loading member profile…"}</Text>

          <Text style={styles.label}>VISIT DATE AND TIME</Text>
          {Platform.OS === "web" ? <WebDateTimeInput
            value={toLocalDateTimeInputValue(new Date(visitDate + "T" + visitTime + ":00"))}
            minimum={toLocalDateTimeInputValue(new Date())}
            onChange={(value) => {
              const parts = value.split("T");
              if (parts[0]) setVisitDate(parts[0]);
              if (parts[1]) setVisitTime(parts[1].slice(0, 5));
            }}
          /> : <TouchableOpacity style={styles.inputContainer} onPress={openVisitDateTimePicker} accessibilityRole="button" accessibilityLabel="Select daily pass visit date and time">
            <Ionicons name="calendar-outline" size={18} color="#98A2B3" />
            <Text style={styles.input}>{new Date(visitDate + "T" + visitTime + ":00").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Text>
            <Ionicons name="chevron-down" size={16} color="#98A2B3" />
          </TouchableOpacity>}
          <Text style={styles.fieldHint}>Choose your planned arrival time. Your pass remains valid for the selected visit date.</Text>

          <Text style={styles.label}>PAYMENT METHOD</Text>

          {[
            { name: "PayPal", icon: "logo-paypal" as const },
            { name: "Cash", icon: "cash-outline" as const },
          ].map((method) => {
            const active = paymentMethod === method.name;

            return (
              <TouchableOpacity
                key={method.name}
                style={[
                  styles.paymentOption,
                  active && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod(method.name)}
              >
                <View style={styles.paymentIcon}>
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color="#4D8DFF"
                  />
                </View>
                <Text style={styles.paymentName}>{method.name}</Text>
                <View style={styles.radioOuter}>
                  {active && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {latestPass?.payment_method === "PayPal" && latestPass.status === "pending" && latestPass.payment_status !== "paid" ? <TouchableOpacity style={styles.paypalButton} onPress={() => void startPaypalCheckout(latestPass)}><Ionicons name="logo-paypal" size={18} color="#FFFFFF" /><Text style={styles.purchaseButtonText}>{latestPass.paypal_invoice_url ? "CONTINUE TO PAYPAL" : "RETRY PAYPAL CHECKOUT"}</Text></TouchableOpacity> : null}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>₱150.00</Text>
          </View>

          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt-outline" size={19} color="#FFFFFF" />
            <Text style={styles.purchaseButtonText}>
              {submitted ? "SUBMIT ANOTHER REQUEST" : paymentMethod === "PayPal" ? "REQUEST & PAY WITH PAYPAL" : "REQUEST DAILY PASS"}
            </Text>
          </TouchableOpacity>

          {(submitted || Boolean(latestRequest)) && (
            <View style={styles.pendingNotice}>
              <Ionicons
                name="time-outline"
                size={18}
                color="#F0B45A"
              />
              <Text style={styles.pendingText}>
                {latestRequest || "Your request is saved and is awaiting staff review."}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.membershipLink}
          onPress={() => router.push("/member/membership")}
        >
          <Ionicons name="card-outline" size={19} color="#4D8DFF" />
          <Text style={styles.membershipLinkText}>
            Explore Membership Plans Instead
          </Text>
          <Ionicons name="chevron-forward" size={19} color="#98A2B3" />
        </TouchableOpacity>

        <Text style={styles.footer}>
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
          icon="barbell-outline"
          label="Classes"
          onPress={() => router.push("/member/classes")}
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
      {Platform.OS === "ios" ? <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setPickerVisible(false)}><Text style={styles.pickerAction}>Cancel</Text></TouchableOpacity>
              <Text style={styles.pickerTitle}>Visit date and time</Text>
              <TouchableOpacity onPress={() => { setVisitDate(localIsoDate(pickerDraft)); setVisitTime(localTime(pickerDraft)); setPickerVisible(false); }}><Text style={styles.pickerAction}>Done</Text></TouchableOpacity>
            </View>
            <DateTimePicker value={pickerDraft} mode="datetime" display="spinner" minimumDate={new Date()} onValueChange={(_event, date) => setPickerDraft(date)} />
          </View>
        </View>
      </Modal> : null}
    </SafeAreaView>
  );
}

function WebDateTimeInput(props: { value: string; minimum: string; onChange: (value: string) => void }) {
  return React.createElement("input" as any, {
    type: "datetime-local",
    value: props.value,
    min: props.minimum,
    "aria-label": "Select daily pass visit date and time",
    onChange: (event: { currentTarget: { value: string } }) => props.onChange(event.currentTarget.value),
    style: {
      boxSizing: "border-box",
      width: "100%",
      minHeight: 48,
      backgroundColor: "#0B1A28",
      border: "1px solid #24394A",
      borderRadius: 10,
      padding: "0 12px",
      color: "#FFFFFF",
      colorScheme: "dark",
      fontSize: 12,
      marginBottom: 8,
    },
  });
}

function NavItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={21} color="#98A2B3" />
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = createThemeStyles({
  container: { flex: 1, backgroundColor: "#06111C" },
  header: {
    height: 54, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 18,
  },
  headerButton: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "#102131", alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 25 },
  eyebrow: {
    color: "#4D8DFF", fontSize: 10, fontWeight: "800",
    letterSpacing: 2, marginBottom: 7,
  },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "800" },
  subtitle: { color: "#98A2B3", fontSize: 12, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  heroCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1D3A55", borderRadius: 18,
    padding: 20, marginBottom: 15,
  },
  heroIcon: {
    width: 55, height: 55, borderRadius: 15,
    backgroundColor: "#1769FF", alignItems: "center",
    justifyContent: "center", marginBottom: 17,
  },
  planLabel: {
    color: "#4D8DFF", fontSize: 10,
    fontWeight: "800", letterSpacing: 1.4,
  },
  price: { color: "#FFFFFF", fontSize: 35, fontWeight: "800", marginTop: 6 },
  priceDecimal: { fontSize: 22 },
  priceCaption: { color: "#98A2B3", fontSize: 11, marginTop: 5 },
  heroDivider: { height: 1, backgroundColor: "#24394A", marginVertical: 18 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 13 },
  benefitText: { color: "#D0D5DD", fontSize: 11, flex: 1 },
  noticeCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 9,
    backgroundColor: "#0B1A28", borderRadius: 12,
    padding: 13, marginBottom: 25,
  },
  noticeText: { color: "#98A2B3", fontSize: 10, lineHeight: 17, flex: 1 },
  accessCard: { backgroundColor: "#102131", borderWidth: 1, borderColor: "#1D3A55", borderRadius: 16, padding: 16, marginBottom: 22, alignItems: "center" },
  accessMessage: { color: "#98A2B3", fontSize: 11, lineHeight: 17, textAlign: "center" },
  checkedIn: { flexDirection: "row", alignItems: "center", gap: 8 },
  qrCard: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12, marginVertical: 10 },
  qrCaption: { color: "#98A2B3", fontSize: 10, lineHeight: 16, textAlign: "center" },
  refreshPass: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, marginTop: 5 },
  refreshPassText: { color: "#4D8DFF", fontSize: 10, fontWeight: "700" },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 13 },
  formCard: {
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 16, padding: 16,
  },
  label: {
    color: "#98A2B3", fontSize: 10, fontWeight: "700",
    letterSpacing: 0.8, marginBottom: 9, marginTop: 7,
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#0B1A28", borderWidth: 1,
    borderColor: "#24394A", borderRadius: 10,
    height: 48, paddingHorizontal: 12, marginBottom: 16,
  },
  input: { flex: 1, color: "#FFFFFF", fontSize: 12 },
  fieldHint: { color: "#98A2B3", fontSize: 10, lineHeight: 15, marginTop: -2, marginBottom: 12 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  pickerPanel: { backgroundColor: "#102131", borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 20 },
  pickerHeader: { minHeight: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "#24394A" },
  pickerTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  pickerAction: { color: "#4D8DFF", fontSize: 12, fontWeight: "700" },
  paymentOption: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0B1A28", borderWidth: 1,
    borderColor: "#24394A", borderRadius: 11,
    padding: 11, marginBottom: 10,
  },
  paymentOptionActive: { borderColor: "#1769FF", backgroundColor: "#102742" },
  paymentIcon: {
    width: 37, height: 37, borderRadius: 9,
    backgroundColor: "#142C4A", alignItems: "center",
    justifyContent: "center", marginRight: 10,
  },
  paymentName: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", flex: 1 },
  radioOuter: {
    width: 19, height: 19, borderRadius: 10,
    borderWidth: 2, borderColor: "#4D8DFF",
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#4D8DFF" },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderTopWidth: 1,
    borderTopColor: "#24394A", paddingTop: 17, marginTop: 8,
  },
  totalLabel: { color: "#D0D5DD", fontSize: 12 },
  totalPrice: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  purchaseButton: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 9, backgroundColor: BLUE,
    height: 48, borderRadius: 10, marginTop: 20,
  },
  paypalButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: "#0B1A28", borderWidth: 1, borderColor: "#1769FF", height: 46, borderRadius: 10, marginTop: 11 },
  purchaseButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  pendingNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#332C1F", borderRadius: 9, padding: 11, marginTop: 13,
  },
  pendingText: { flex: 1, color: "#F0B45A", fontSize: 10, lineHeight: 16 },
  membershipLink: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#102131", borderWidth: 1,
    borderColor: "#1C3040", borderRadius: 12,
    padding: 15, marginTop: 16,
  },
  membershipLinkText: { flex: 1, color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  footer: {
    color: "#667085", fontSize: 9, textAlign: "center",
    marginTop: 25, letterSpacing: 0.5,
  },
  bottomNav: {
    height: 65, flexDirection: "row", backgroundColor: "#0B1A28",
    borderTopWidth: 1, borderTopColor: "#1C3040",
    justifyContent: "space-around", alignItems: "center", paddingHorizontal: 4,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: "#98A2B3", fontSize: 9 },
  bottomLine: { height: 3, backgroundColor: "#169BFF" },
});
