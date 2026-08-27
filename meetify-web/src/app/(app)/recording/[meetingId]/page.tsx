"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useMobileMenu } from "@/components/layout/MobileMenuContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RecordingOrb, type RecordingPhase } from "@/components/recording/RecordingOrb";
import { DeviceSetupModal } from "@/components/recording/DeviceSetupModal";
import { useElapsed } from "@/lib/hooks/useElapsed";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import {
  meetingService,
  recordingService,
  transcriptionService,
  classificationService,
} from "@/lib/api/services";
import { saveStoredResult } from "@/lib/utils/resultCache";
import { getFriendlyMessage } from "@/lib/utils/format";
import { toast } from "@/lib/store/toastStore";
import type { Meeting } from "@/lib/types";
import { Mic, Square, Settings, Users, MapPin, Loader2, DownloadCloud } from "lucide-react";

const phaseCopy: Record<RecordingPhase, { label: string; hint: string }> = {
  ready: { label: "Ready to record", hint: "Tap the button below to start" },
  recording: { label: "Recording…", hint: "Meeting in progress. Tap Stop when done." },
  uploading: { label: "Uploading…", hint: "Sending audio to the server" },
  transcribing: { label: "Transcribing…", hint: "AI is processing your audio (30–90s)" },
  classifying: { label: "Extracting action items…", hint: "Finding tasks, deadlines & decisions" },
  done: { label: "Done!", hint: "Your action items are ready" },
  warning: { label: "Attention needed", hint: "Follow the instruction and try again" },
};

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const DEVICE_STORAGE_KEY = "meetify:connected-device";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

interface ConnectedDevice {
  hostIp: string;
  port: number;
  deviceName: string;
  connectedAt: number;
}

export default function RecordingPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const router = useRouter();
  const { openMenu } = useMobileMenu();
  const { acquire: acquireWakeLock, release: releaseWakeLock } = useWakeLock();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [phase, setPhase] = useState<RecordingPhase>("ready");
  const [setupOpen, setSetupOpen] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(null);
  const [isFetchingDevice, setIsFetchingDevice] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIdRef = useRef<string | null>(null);

  const elapsed = useElapsed(phase === "recording");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await meetingService.get(meetingId);
        if (mounted) setMeeting(data);
      } catch (err) {
        toast.warning(getFriendlyMessage(err, "Failed to load meeting details."));
      } finally {
        if (mounted) setLoadingMeeting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [meetingId]);

  // Restore last-connected device so the fetch button knows where to pull
  // from, even after a page reload.
  useEffect(() => {
    let mounted = true;
    try {
      const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
      if (raw) {
        queueMicrotask(() => {
          if (mounted) setConnectedDevice(JSON.parse(raw));
        });
      }
    } catch {
      // ignore malformed/unavailable storage
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDeviceProvisioned(
    _result: unknown,
    info: { hostIp: string; port: number; deviceName: string }
  ) {
    const device: ConnectedDevice = { ...info, connectedAt: Date.now() };
    setConnectedDevice(device);
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(device));
    } catch {
      // ignore storage failures — connection still works for this session
    }
    setSetupOpen(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      await acquireWakeLock();

      const rec = await recordingService.create(meetingId);
      recordingIdRef.current = rec.id;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      recorderRef.current = recorder;
      setPhase("recording");
    } catch (err) {
      releaseWakeLock();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const isPermission = err instanceof DOMException && err.name === "NotAllowedError";
      toast.warning(
        isPermission
          ? "Microphone access is needed to record meetings."
          : getFriendlyMessage(err, "Please check microphone access and try again."),
        "Permission required"
      );
    }
  }

  async function stopAndProcess() {
    const recorder = recorderRef.current;
    const recordingId = recordingIdRef.current;
    if (!recorder || !recordingId) return;

    releaseWakeLock();
    setPhase("uploading");

    try {
      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const type = recorder.mimeType || "audio/webm";
          resolve(new Blob(chunksRef.current, { type }));
        };
        recorder.stop();
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());

      await recordingService.upload(recordingId, blob);

      setPhase("transcribing");
      const transcriptionRes = await transcriptionService.transcribe(recordingId);

      setPhase("classifying");
      const result = await classificationService.classify(transcriptionRes.transcript_id);

      setPhase("done");

      saveStoredResult(meetingId, {
        transcriptId: transcriptionRes.transcript_id,
        transcript: transcriptionRes.transcript,
        result,
      });

      setTimeout(() => {
        router.replace(`/meetings/${meetingId}`);
      }, 800);
    } catch (err) {
      setPhase("warning");
      toast.warning(
        getFriendlyMessage(err, "Please check the recording and try again."),
        (err as { status?: number })?.status === 409 ? "Already uploaded" : undefined
      );
    }
  }

  // Pulls the most recent audio the paired hardware device has streamed to
  // your server (hostIp:port), then runs it through the same
  // transcribe -> classify pipeline as a browser recording.
  async function fetchLatestFromDevice() {
    if (!connectedDevice) {
      toast.warning(
        "Pair a recorder in Device settings before fetching audio.",
        "Connect a device first"
      );
      setSetupOpen(true);
      return;
    }

    setIsFetchingDevice(true);
    setPhase("uploading");

    try {
      const rec = await recordingService.create(meetingId);
      recordingIdRef.current = rec.id;

      // Requires a `fetchFromDevice` method on recordingService that asks the
      // backend for the latest audio buffered from this device.
      await recordingService.fetchFromDevice(rec.id);

      setPhase("transcribing");
      const transcriptionRes = await transcriptionService.transcribe(rec.id);

      setPhase("classifying");
      const result = await classificationService.classify(transcriptionRes.transcript_id);

      setPhase("done");

      saveStoredResult(meetingId, {
        transcriptId: transcriptionRes.transcript_id,
        transcript: transcriptionRes.transcript,
        result,
      });

      setTimeout(() => {
        router.replace(`/meetings/${meetingId}`);
      }, 800);
    } catch (err) {
      setConnectedDevice(null);
      try {
        localStorage.removeItem(DEVICE_STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
      setPhase("warning");
      toast.warning(
        getFriendlyMessage(
          err,
          "Couldn't fetch audio from the device. Connect it and make sure it is powered on and connected to Wi-Fi."
        ),
        (err as { status?: number })?.status === 404 ? "No audio found" : undefined
      );
    } finally {
      setIsFetchingDevice(false);
    }
  }

  const isProcessing = phase === "uploading" || phase === "transcribing" || phase === "classifying";
  const baseCopy = phaseCopy[phase];
  const copy =
    isFetchingDevice && phase === "uploading"
      ? { label: "Fetching audio…", hint: "Pulling the latest recording from your device" }
      : baseCopy;

  return (
    <>
      <Topbar title="Recording" onMenuClick={openMenu} />

      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          {loadingMeeting ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            meeting && (
              <Card className="mb-6">
                <h2 className="font-display text-[15px] font-semibold text-ink">
                  {meeting.subject}
                </h2>
                <div className="mt-1.5 flex flex-col gap-1 text-[13px] text-ink-soft">
                  {meeting.meeting_with && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {meeting.meeting_with}
                    </p>
                  )}
                  {meeting.location && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {meeting.location}
                    </p>
                  )}
                  {meeting.participants && meeting.participants.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {meeting.participants.join(", ")}
                    </p>
                  )}
                </div>
              </Card>
            )
          )}

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="mb-6 max-w-sm text-[13px] text-ink-soft">
              For better transcription, ask each participant to briefly introduce themselves at
              the start of the meeting.
            </p>

            <RecordingOrb phase={phase} />

            <p className="mt-6 font-display text-xl font-semibold text-ink">{copy.label}</p>
            <p className="mt-1 max-w-sm text-[14px] text-ink-soft">{copy.hint}</p>

            {phase === "recording" && (
              <p className="mt-4 font-display text-3xl font-bold tabular-nums text-primary">
                {elapsed}
              </p>
            )}

            {isProcessing && (
              <div className="mt-6 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    style={{ opacity: 0.3 + i * 0.3 }}
                  />
                ))}
              </div>
            )}

            {connectedDevice && phase === "ready" && (
              <p className="mt-4 text-[12px] text-ink-faint">
                Device configured: {connectedDevice.deviceName} ({connectedDevice.hostIp}:
                {connectedDevice.port})
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2.5 pb-4 pt-6">
            {phase === "ready" && (
              <>
                <Button icon={<Mic className="h-4 w-4" />} onClick={startRecording} fullWidth>
                  Start recording
                </Button>
                <Button
                  icon={<DownloadCloud className="h-4 w-4" />}
                  variant="outline"
                  onClick={fetchLatestFromDevice}
                  fullWidth
                >
                  Fetch latest audio from device
                </Button>
              </>
            )}

            {phase === "recording" && (
              <Button
                icon={<Square className="h-4 w-4" />}
                onClick={stopAndProcess}
                variant="danger"
                fullWidth
              >
                Stop &amp; process
              </Button>
            )}

            {phase === "warning" && (
              <Button variant="outline" fullWidth onClick={() => setPhase("ready")}>
                Try again
              </Button>
            )}

            <Button
              variant="outline"
              fullWidth
              icon={<Settings className="h-4 w-4" />}
              onClick={() => setSetupOpen(true)}
            >
              Device settings
            </Button>
          </div>
        </div>
      </div>

      <DeviceSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        defaultHostIp={connectedDevice?.hostIp ?? "192.168.1.50"}
        defaultPort={connectedDevice ? String(connectedDevice.port) : "8000"}
        onProvisioned={handleDeviceProvisioned}
      />
    </>
  );
}