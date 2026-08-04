# Meetify — Web

AI meeting assistant: record meetings in the browser, get an automatic
transcript, and let AI pull out tasks, deadlines, and decisions. This is the
Next.js web port of the original React Native (Expo) app.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** with a small custom design-token system (see
  `src/app/globals.css`)
- **Zustand** for auth/toast/dialog state (`persist` middleware for auth)
- **lucide-react** for icons
- Browser **MediaRecorder API** for mic recording (replaces `expo-av`)
- Browser **Web Bluetooth API** for hardware-device pairing (replaces
  `react-native-ble-plx`) — same GATT service/characteristic contract as the
  original firmware

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then edit values if needed
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.local.example`. By default the app points at the production API
(`emrchains.com/meeting-api-new`). Set `NEXT_PUBLIC_ENV=local` to use
`NEXT_PUBLIC_API_URL_LOCAL` instead (e.g. a FastAPI backend running on your
machine).

## Project structure

```
src/
  app/
    login/, register/            Auth pages (public)
    (app)/                       Auth-guarded route group
      meetings/                  Meeting list
      meetings/new/              Pre-meeting form
      meetings/[id]/             Meeting detail + results
      recording/[meetingId]/     Live recording screen
  components/
    ui/                          Button, Input, Card, Badge, Toaster, ...
    layout/                      Sidebar, Topbar, AppShell, mobile drawer
    auth/                        Split-screen auth shell
    meetings/                    MeetingCard
    recording/                  RecordingOrb (signature visual), DeviceSetupModal
    results/                     ResultsView (action items, Urdu toggle, calendar sync)
  lib/
    api/                         Fetch client + typed service functions
    ble/                         Web Bluetooth device-provisioning protocol
    store/                       Zustand stores (auth, toast, confirm dialog)
    hooks/                       useElapsed (recording timer), useWakeLock
    utils/                       Friendly error messages, date formatting, result cache
    types/                       Shared TypeScript types mirroring the API schema
```

## Notes on parity with the original app

- **Auth, meetings, recording, transcription, classification, calendar
  sync, and Urdu translation** all call the same backend endpoints as the
  RN app (`src/lib/api/services.ts`).
- **Local result caching**: the RN app cached the last transcript/result per
  meeting in `AsyncStorage`; the web app does the same with `localStorage`
  (`src/lib/utils/resultCache.ts`), so meeting detail pages can show results
  without depending on route params.
- **Alerts**: native `Alert.alert` calls became a toast system
  (`useToastStore`) for one-way notices, and a promise-based confirm dialog
  (`useDialogStore` / `confirmDialog()`) for the one flow that needed a
  Cancel/Confirm choice (pushing to Google Calendar after OAuth).
- **Google Calendar OAuth**: the RN app opened the browser via `Linking`;
  the web app opens a new tab (`window.open`) and then asks the user to
  confirm once they've finished signing in.
- **Device pairing (Bluetooth)**: Web Bluetooth only works in Chromium
  browsers (Chrome, Edge) served over HTTPS or `localhost`, and it shows a
  native device picker instead of an in-app scan list — the modal
  feature-detects and shows a clear message on unsupported browsers
  (Safari, Firefox).

## Build

```bash
npm run build
npm start
```
