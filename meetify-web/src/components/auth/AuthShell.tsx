import { Mic, Sparkles, CalendarCheck, Languages } from "lucide-react";
import { ReactNode } from "react";

const features = [
  { icon: Sparkles, text: "AI pulls out tasks, deadlines & decisions automatically" },
  { icon: CalendarCheck, text: "Push action items straight to Google Calendar" },
  { icon: Languages, text: "Read every transcript in English or Urdu" },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Brand panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Mic className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">Meetify</span>
        </div>

        <div className="relative">
          <h1 className="font-display text-[34px] font-semibold leading-[1.15]">
            Every meeting, turned into action.
          </h1>
          <p className="mt-3 max-w-sm text-[15px] text-white/80">
            Record, transcribe, and let AI find the follow-ups — so nothing said
            in the room gets lost after it.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-[14px] text-white/90">
                <f.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-white/50">
          © {new Date().getFullYear()} Meetify. AI meeting assistant.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Mic className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold text-ink">Meetify</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
