import { createThemeStyles, useThemeMode } from "../../lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdminMessage, AdminPanel, AdminScreen, AdminColors as C } from "../../components/admin-ui";
import { errorMessage, formatAdminDate } from "../../lib/admin-data";
import { supabase } from "../../lib/supabase";

type ScanResult = { member_name: string; visit_on: string; checked_in_at: string };

export default function DailyPassScanner() {
  useThemeMode();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const scanLock = useRef(false);

  const handleScan = useCallback(async (data: string) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const prefix = "STAYFIT-DAYPASS:";
      if (!data.startsWith(prefix)) throw new Error("This QR code is not a StayFit daily entry pass.");
      const { data: checkedIn, error: checkInError } = await supabase.rpc("check_in_daily_pass", { p_token: data.slice(prefix.length) });
      if (checkInError) throw checkInError;
      setResult(checkedIn as ScanResult);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return <AdminScreen title="Daily Pass Scanner">
    <AdminMessage tone="info">Scan the member’s entry QR. The server checks approval, payment, and visit date, then records the check-in. Each daily pass can be used once.</AdminMessage>
    {!permission ? <AdminMessage tone="info">Checking camera permission…</AdminMessage> : !permission.granted ? <AdminPanel style={styles.permissionPanel}>
      <Ionicons name="camera-outline" size={34} color={C.blue} />
      <Text style={styles.body}>Camera access is needed to scan entry passes.</Text>
      <TouchableOpacity style={styles.button} onPress={() => void requestPermission()}><Text style={styles.buttonText}>Allow camera</Text></TouchableOpacity>
    </AdminPanel> : result ? <AdminPanel style={styles.resultPanel}>
      <View style={styles.resultIcon}><Ionicons name="checkmark" size={30} color={C.green} /></View>
      <Text style={styles.resultTitle}>Entry confirmed</Text>
      <Text style={styles.memberName}>{result.member_name}</Text>
      <Text style={styles.body}>Daily pass · {formatAdminDate(result.visit_on)}</Text>
      <Text style={styles.body}>Checked in {new Date(result.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
      <TouchableOpacity style={styles.button} onPress={() => { setResult(null); setError(""); scanLock.current = false; }}><Text style={styles.buttonText}>Scan another pass</Text></TouchableOpacity>
    </AdminPanel> : <>
      <View style={styles.cameraFrame}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={busy ? undefined : ({ data }) => void handleScan(data)}
        />
        <View pointerEvents="none" style={styles.scanFrame} />
      </View>
      {busy ? <AdminMessage tone="info">Checking pass with the backend…</AdminMessage> : null}
      {error ? <AdminMessage>{error}</AdminMessage> : null}
      {error ? <TouchableOpacity style={styles.button} onPress={() => { setError(""); scanLock.current = false; }}><Text style={styles.buttonText}>Try scanning again</Text></TouchableOpacity> : null}
    </>}
  </AdminScreen>;
}

const styles = createThemeStyles({
  permissionPanel: { alignItems: "center", gap: 12, paddingVertical: 28 },
  cameraFrame: { height: 390, borderRadius: 16, overflow: "hidden", backgroundColor: "#000", borderWidth: 1, borderColor: C.borderBright, alignItems: "center", justifyContent: "center" },
  scanFrame: { width: 230, height: 230, borderWidth: 3, borderColor: C.blue, borderRadius: 20 },
  resultPanel: { alignItems: "center", paddingVertical: 28 },
  resultIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#123D2A", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  resultTitle: { color: C.green, fontSize: 18, fontWeight: "800" },
  memberName: { color: C.text, fontSize: 20, fontWeight: "800", marginTop: 12 },
  body: { color: C.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
  button: { backgroundColor: C.blueStrong, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 12, marginTop: 18, alignItems: "center" },
  buttonText: { color: C.text, fontSize: 12, fontWeight: "800" },
});
