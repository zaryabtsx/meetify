// Ported from the native app's BLE provisioning flow (react-native-ble-plx) to
// the Web Bluetooth API. Pairs a physical recorder device to Wi-Fi and tells
// it where to stream/upload audio (host IP + port). Recording/playback of the
// audio itself happens on your server — this module only configures the device.
//
// Web Bluetooth is only available in Chromium-based browsers (Chrome, Edge)
// over HTTPS or localhost. Always feature-detect with `isBluetoothSupported()`
// before using anything else in this file.

// Must match the firmware's provisioning GATT contract exactly.
export const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
export const WRITE_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
export const STATUS_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";

export interface WifiSettings {
  ssid: string;
  password: string;
  hostIp: string;
  port: number;
}

export type Stage = "connecting" | "discovering" | "sending" | "verifying" | "done";

export interface ProvisionResult {
  // 'provisioned' = device confirmed ok; 'assumed' = write went through but the
  // firmware dropped the link / status was unreadable, which we treat as a
  // soft success.
  status: "provisioned" | "assumed";
  message: string;
}

export class ProvisionError extends Error {}

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function randomMac(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()
  ).join(":");
}

// Standalone flow: no backend lookup, so ids are zeroed and the MAC is
// generated locally — the same thing the mobile app does in UDP mode.
export function buildPayload(s: WifiSettings): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    mac_address: randomMac(),
    property_id: 0,
    organization_id: 0,
    device_name: "QuickComm",
    comm_mode: "udp",
    mode: "local",
    local_ip: s.hostIp.trim(),
    local_port: s.port,
  };
  if (s.ssid.trim()) payload.ssid = s.ssid.trim();
  if (s.password) payload.password = s.password;
  return payload;
}

/** Opens the browser's native device picker filtered to our service UUID. */
export async function requestDevice(): Promise<BluetoothDevice> {
  if (!isBluetoothSupported()) {
    throw new ProvisionError(
      "This browser doesn't support Web Bluetooth. Try Chrome or Edge over HTTPS."
    );
  }
  return navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
  });
}

export async function provision(
  device: BluetoothDevice,
  settings: WifiSettings,
  onStage: (stage: Stage) => void
): Promise<ProvisionResult> {
  if (!device.gatt) {
    throw new ProvisionError("This device does not support GATT connections.");
  }

  onStage("connecting");
  const server = await device.gatt.connect();

  try {
    onStage("discovering");
    const service = await server.getPrimaryService(SERVICE_UUID);
    const writeChar = await service.getCharacteristic(WRITE_CHAR_UUID);
    const statusChar = await service.getCharacteristic(STATUS_CHAR_UUID);

    onStage("sending");
    const bytes = new TextEncoder().encode(JSON.stringify(buildPayload(settings)));

    let assumedOk = false;
    try {
      if (writeChar.writeValueWithResponse) {
        await writeChar.writeValueWithResponse(bytes);
      } else {
        await writeChar.writeValue(bytes);
      }
    } catch {
      try {
        if (writeChar.writeValueWithoutResponse) {
          await writeChar.writeValueWithoutResponse(bytes);
        } else {
          await writeChar.writeValue(bytes);
        }
      } catch {
        // Firmware sometimes applies settings and drops the link before the
        // write is acknowledged — treat as sent, verify below.
        assumedOk = true;
      }
    }

    onStage("verifying");
    await new Promise((r) => setTimeout(r, 150));

    try {
      const statusValue = await statusChar.readValue();
      const text = new TextDecoder().decode(statusValue);
      const result = JSON.parse(text);

      if (result.ok === false) {
        throw new ProvisionError(
          result.error === "invalid_json"
            ? "The device rejected the settings — check your entries."
            : `The device reported a problem${result.error ? ` (${result.error})` : ""}.`
        );
      }

      onStage("done");
      return {
        status: "provisioned",
        message:
          result.stage === "provisioned"
            ? "Device confirmed the settings."
            : "Settings sent to the device.",
      };
    } catch (err) {
      if (err instanceof ProvisionError) throw err;
      // Status characteristic unreadable after the write: soft success.
      onStage("done");
      return {
        status: "assumed",
        message: assumedOk
          ? "Settings were sent, but the device did not confirm. Check the Wi-Fi status on the device itself."
          : "Settings sent. Could not read confirmation — check the Wi-Fi status on the device itself.",
      };
    }
  } finally {
    try {
      server.disconnect();
    } catch {
      // ignore
    }
  }
}
