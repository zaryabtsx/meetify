"use client";

import { useState } from "react";
import { X, Bluetooth, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  isBluetoothSupported,
  requestDevice,
  provision,
  ProvisionError,
  type ProvisionResult,
  type Stage,
} from "@/lib/ble/provisioning";

type Phase = "form" | "requesting" | "provisioning" | "success" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  connecting: "Connecting to device…",
  discovering: "Discovering services…",
  sending: "Sending Wi-Fi settings…",
  verifying: "Waiting for confirmation…",
  done: "Done",
};

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

export function DeviceSetupModal({
  open,
  onClose,
  defaultHostIp = "",
  defaultPort = "8000",
  onProvisioned,
}: {
  open: boolean;
  onClose: () => void;
  defaultHostIp?: string;
  defaultPort?: string;
  onProvisioned?: (result: ProvisionResult) => void;
}) {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hostIp, setHostIp] = useState(defaultHostIp);
  const [port, setPort] = useState(defaultPort);

  const [phase, setPhase] = useState<Phase>("form");
  const [stage, setStage] = useState<Stage>("connecting");
  const [deviceName, setDeviceName] = useState<string>("");
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldError, setFieldError] = useState("");

  if (!open) return null;

  const supported = isBluetoothSupported();

  function reset() {
    setResult(null);
    setErrorMsg("");
    setFieldError("");
    setPhase("form");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function startPairing() {
    if (!ssid.trim()) {
      setFieldError("Enter the Wi-Fi network name (SSID).");
      return;
    }
    if (!IP_RE.test(hostIp.trim())) {
      setFieldError("Enter a valid server IP address, e.g. 192.168.1.100.");
      return;
    }
    const portNum = parseInt(port, 10);
    if (!portNum || portNum < 1 || portNum > 65535) {
      setFieldError("Enter a port between 1 and 65535.");
      return;
    }
    setFieldError("");

    setPhase("requesting");
    try {
      const device = await requestDevice();
      setDeviceName(device.name || "Meetify device");
      setPhase("provisioning");

      const res = await provision(device, { ssid, password, hostIp, port: portNum }, setStage);
      setResult(res);
      setPhase("success");
      onProvisioned?.(res);
    } catch (err) {
      // User dismissing the native picker throws a NotFoundError — treat as a
      // quiet cancel back to the form rather than an error state.
      if (err instanceof DOMException && err.name === "NotFoundError") {
        setPhase("form");
        return;
      }
      setErrorMsg(
        err instanceof ProvisionError || err instanceof Error
          ? err.message
          : "Something went wrong while pairing the device."
      );
      setPhase("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface sm:max-w-md sm:rounded-2xl sm:shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-display text-[16px] font-semibold text-ink">Connect device</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-ink-faint hover:bg-canvas cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="p-5">
          {!supported ? (
            <div className="text-center">
              <XCircle className="mx-auto h-10 w-10 text-warning" />
              <p className="mt-3 text-[14px] text-ink-soft">
                Your browser doesn&apos;t support Web Bluetooth. Open this page in{" "}
                <strong>Chrome</strong> or <strong>Edge</strong> over HTTPS to pair a hardware
                recorder.
              </p>
              <Button variant="outline" fullWidth className="mt-5" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : phase === "form" ? (
            <div>
              <p className="mb-4 text-[13px] text-ink-soft">
                Pair a hardware recorder to your Wi-Fi network and point it at your upload
                server.
              </p>
              <Input
                label="Wi-Fi network (SSID)"
                placeholder="Your Wi-Fi name"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />
              <div className="relative">
                <Input
                  label="Wi-Fi password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-[12px] font-semibold text-primary cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                label="Server IP (where audio uploads)"
                placeholder="192.168.1.100"
                value={hostIp}
                onChange={(e) => setHostIp(e.target.value)}
              />
              <Input
                label="Server port"
                placeholder="8000"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                error={fieldError}
              />
              <Button fullWidth onClick={startPairing} className="mt-1">
                Find device
              </Button>
            </div>
          ) : phase === "requesting" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-[14px] text-ink-soft">
                Choose your device from the browser&apos;s Bluetooth picker…
              </p>
            </div>
          ) : phase === "provisioning" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              {deviceName && (
                <p className="mt-3 text-[13px] font-semibold text-ink">{deviceName}</p>
              )}
              <p className="mt-1 text-[14px] text-ink-soft">{STAGE_LABELS[stage]}</p>
            </div>
          ) : phase === "success" && result ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="mt-3 font-display text-[16px] font-semibold text-ink">
                {result.status === "provisioned" ? "Device set up" : "Settings sent"}
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">{result.message}</p>
              <p className="mt-1 text-[13px] text-ink-soft">
                Keep the device powered until it connects to Wi-Fi.
              </p>
              <div className="mt-5 flex w-full flex-col gap-2">
                <Button fullWidth onClick={handleClose}>
                  Done
                </Button>
                <Button variant="ghost" fullWidth onClick={reset}>
                  Set up another device
                </Button>
              </div>
            </div>
          ) : phase === "error" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <XCircle className="h-10 w-10 text-danger" />
              <p className="mt-3 font-display text-[16px] font-semibold text-ink">Setup failed</p>
              <p className="mt-2 text-[13px] text-ink-soft">{errorMsg}</p>
              <Button fullWidth className="mt-5" onClick={reset}>
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
