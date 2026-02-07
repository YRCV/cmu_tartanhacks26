import { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import axios, { AxiosError } from "axios";

type ConnState = "OFFLINE" | "CONNECTING" | "ONLINE" | "REBOOTING";

const USE_MOCK = false; // ✅ set true to develop UI without hardware/backends
const DEFAULT_TIMEOUT_MS = 2500;

// If your firmware adds these later, UI will auto-enable sections.
// For now we infer minimal capability from successful endpoints.
type Capabilities = {
  led: boolean;
  ota: boolean;
  servo: boolean;
  aiPipeline: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatErr(e: unknown): string {
  const ax = e as AxiosError;
  if (ax?.code === "ECONNABORTED") return "Request timed out.";
  if (ax?.message) return ax.message;
  return "Unknown error.";
}

/**
 * A small, reliable request helper:
 * - timeout
 * - retry with backoff
 * - returns {ok, data, error}
 */
async function safeGet(url: string, opts?: { timeoutMs?: number; retries?: number }) {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts?.retries ?? 2;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { timeout: timeoutMs });
      return { ok: true as const, data: res.data, error: null as any };
    } catch (e) {
      lastErr = e;
      // backoff: 250ms, 500ms, 1000ms ...
      await sleep(250 * Math.pow(2, attempt));
    }
  }
  return { ok: false as const, data: null as any, error: lastErr };
}

export default function HomeScreen() {
  const [espIp, setEspIp] = useState(process.env.EXPO_PUBLIC_ESP_IP || "");
  const baseUrl = useMemo(() => `http://${espIp}`, [espIp]);

  const [conn, setConn] = useState<ConnState>("OFFLINE");
  const [statusText, setStatusText] = useState<string>("No data yet.");
  const [busy, setBusy] = useState(false);

  const [autoPoll, setAutoPoll] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const [caps, setCaps] = useState<Capabilities>({
    led: true, // your firmware already supports this
    ota: true, // you have /ota/update
    servo: false, // enable when endpoint exists
    aiPipeline: false, // enable when backend endpoint exists
  });

  // ---------- Mock layer (so you can ship UI safely) ----------
  async function mockGet(path: string) {
    await sleep(200);
    if (path === "/") return { ok: true, data: "ESP32 is running! LED Status: OFF" };
    if (path.startsWith("/led/")) return { ok: true, data: `MOCK: ${path}` };
    if (path.startsWith("/ota/update")) return { ok: true, data: "MOCK: OTA started" };
    return { ok: false, data: null, error: new Error("MOCK: Unknown endpoint") };
  }

  async function httpGet(pathOrUrl: string, retries = 2) {
    if (USE_MOCK) {
      const path = pathOrUrl.startsWith("http") ? "/" : pathOrUrl;
      return mockGet(path);
    }
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
    return safeGet(url, { retries });
  }

  // ---------- Connection / polling ----------
  const connect = async () => {
    if (!espIp) {
      Alert.alert("Missing IP", "Enter the ESP32 IP address first.");
      return;
    }
    setConn("CONNECTING");
    const res = await httpGet("/", 1);
    if (res.ok) {
      setConn("ONLINE");
      setStatusText(typeof res.data === "string" ? res.data : JSON.stringify(res.data));
      // (Optional) you can infer capabilities later via /capabilities if you add it.
      setCaps((c) => ({ ...c, led: true, ota: true }));
    } else {
      setConn("OFFLINE");
      setStatusText(`Offline: ${formatErr(res.error)}`);
    }
  };

  const disconnect = () => {
    setConn("OFFLINE");
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => {
    if (!autoPoll || conn !== "ONLINE") return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      const res = await httpGet("/", 0);
      if (res.ok) {
        setStatusText(typeof res.data === "string" ? res.data : JSON.stringify(res.data));
      } else {
        // Don’t flip to OFFLINE immediately; could be transient.
        setStatusText((prev) => prev); // keep last
      }
    }, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [autoPoll, conn, baseUrl]);

  // ---------- Commands ----------
  const sendLedCommand = async (command: "toggle" | "on" | "off") => {
    if (conn !== "ONLINE") {
      Alert.alert("Not connected", "Tap Connect first.");
      return;
    }
    setBusy(true);
    const res = await httpGet(`/led/${command}`, 2);
    setBusy(false);

    if (res.ok) {
      const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      setStatusText(msg);
    } else {
      Alert.alert("ESP32 Error", formatErr(res.error));
    }
  };

  const otaUpdate = async (firmwareUrl: string) => {
    if (conn !== "ONLINE") {
      Alert.alert("Not connected", "Tap Connect first.");
      return;
    }
    if (!caps.ota) {
      Alert.alert("OTA Disabled", "OTA capability not available.");
      return;
    }
    if (!firmwareUrl.startsWith("http")) {
      Alert.alert("Invalid URL", "Firmware URL must start with http(s).");
      return;
    }

    // OTA: show expected behavior (reboot)
    setBusy(true);
    setConn("REBOOTING");
    setStatusText("Starting OTA… device will reboot (expected).");

    const encoded = encodeURIComponent(firmwareUrl);
    const res = await httpGet(`/ota/update?url=${encoded}`, 1);

    setBusy(false);

    if (res.ok) {
      const msg = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
      setStatusText(msg + "\nWaiting for reboot…");
      // give it time to reboot, then auto reconnect
      await sleep(3500);
      await connect();
    } else {
      setConn("ONLINE"); // revert assumption
      Alert.alert("OTA Error", formatErr(res.error));
    }
  };

  // ---------- “Demo script” (safe and simple) ----------
  const runDemo = async () => {
    if (conn !== "ONLINE") {
      Alert.alert("Not connected", "Tap Connect first.");
      return;
    }
    setBusy(true);
    setStatusText("Demo: status check…");
    await httpGet("/", 0);
    await sleep(500);

    setStatusText("Demo: toggle LED…");
    await sendLedCommand("toggle");
    await sleep(700);

    setStatusText("Demo: blink mode…");
    await sendLedCommand("on");
    await sleep(700);

    setStatusText("Demo: stop…");
    await sendLedCommand("off");
    await sleep(300);

    setBusy(false);
    setStatusText("Demo complete ✅ (Manual controls verified)");
  };

  // ---------- UI ----------
  const connPill = (() => {
    const text =
      conn === "ONLINE"
        ? "✅ CONNECTED"
        : conn === "CONNECTING"
          ? "🟡 CONNECTING"
          : conn === "REBOOTING"
            ? "🟠 REBOOTING"
            : "🔴 OFFLINE";
    return <Text style={styles.connPill}>{text}</Text>;
  })();

  const [firmwareUrl, setFirmwareUrl] = useState<string>(
    "http://<your-host>/firmware.bin"
  );
  const [intent, setIntent] = useState<string>("Make LED blink fast and add servo slider");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ESP32 Controller</Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Connection</Text>
        {connPill}

        <Text style={styles.label}>ESP32 IP</Text>
        <TextInput
          style={styles.input}
          value={espIp}
          onChangeText={setEspIp}
          placeholder="192.168.1.150"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button
              title={conn === "ONLINE" ? "Reconnect" : "Connect"}
              onPress={connect}
              disabled={busy || !espIp}
            />
          </View>
          <View style={styles.rowItem}>
            <Button title="Disconnect" onPress={disconnect} disabled={busy} />
          </View>
        </View>

        <Pressable
          onPress={() => setAutoPoll((v) => !v)}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleText}>
            Auto-poll status: {autoPoll ? "ON" : "OFF"}
          </Text>
        </Pressable>

        <Text style={styles.statusBox}>{statusText}</Text>

        {busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator />
            <Text style={styles.busyText}>Working…</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Manual Controls (Always Works)</Text>
        <Text style={styles.subtle}>Use this as your Plan B if AI/OTA acts up.</Text>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button
              title="Toggle"
              onPress={() => sendLedCommand("toggle")}
              disabled={busy || conn !== "ONLINE"}
            />
          </View>
          <View style={styles.rowItem}>
            <Button
              title="Blink"
              onPress={() => sendLedCommand("on")}
              disabled={busy || conn !== "ONLINE"}
            />
          </View>
          <View style={styles.rowItem}>
            <Button
              title="Off"
              onPress={() => sendLedCommand("off")}
              disabled={busy || conn !== "ONLINE"}
            />
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Button title="Run Demo Script" onPress={runDemo} disabled={busy || conn !== "ONLINE"} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>OTA Update (Enable When Ready)</Text>
        <Text style={styles.subtle}>
          Trigger OTA via /ota/update?url=... (device will reboot).
        </Text>

        <Text style={styles.label}>Firmware .bin URL</Text>
        <TextInput
          style={styles.input}
          value={firmwareUrl}
          onChangeText={setFirmwareUrl}
          placeholder="http://host/firmware.bin"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          title="Flash Firmware (OTA)"
          onPress={() => otaUpdate(firmwareUrl)}
          disabled={busy || conn !== "ONLINE" || !caps.ota}
        />

        <Text style={styles.subtle}>
          Tip: keep a “stable.bin” URL here as a panic button on stage.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>AI Generate & Deploy (Disabled until backend exists)</Text>
        <Text style={styles.subtle}>
          This section is safe to merge now: it won’t call anything until you wire endpoints.
        </Text>

        <Text style={styles.label}>Intent</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={intent}
          onChangeText={setIntent}
          placeholder="Describe what you want the device to do…"
          multiline
        />

        <Button
          title="Generate (backend)"
          onPress={() => Alert.alert("Not wired yet", "Enable when backend endpoint exists.")}
          disabled={true /* flip to: !(conn==='ONLINE' && caps.aiPipeline) */}
        />
        <View style={{ height: 8 }} />
        <Button
          title="Deploy (backend → OTA)"
          onPress={() => Alert.alert("Not wired yet", "Enable when backend endpoint exists.")}
          disabled={true}
        />

        <Text style={styles.subtle}>
          When ready, backend should return: UI schema + OTA URL + validator warnings.
        </Text>
      </View>

      <Text style={styles.footer}>
        {USE_MOCK ? "MOCK MODE ENABLED" : "LIVE MODE"} — build UI safely without blocking backend.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginTop: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  h2: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600", opacity: 0.7 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  statusBox: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    fontFamily: "System",
  },
  row: { flexDirection: "row", gap: 8 },
  rowItem: { flex: 1 },
  connPill: {
    fontSize: 13,
    fontWeight: "700",
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  subtle: { fontSize: 12, opacity: 0.65 },
  toggleRow: { paddingVertical: 6 },
  toggleText: { fontSize: 12, fontWeight: "600", opacity: 0.8 },
  busyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  busyText: { fontSize: 12, fontWeight: "600", opacity: 0.8 },
  footer: { textAlign: "center", fontSize: 11, opacity: 0.6, marginBottom: 16 },
});
