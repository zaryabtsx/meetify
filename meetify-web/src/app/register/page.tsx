"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/lib/api/services";
import { useAuthStore } from "@/lib/store/authStore";
import { getFriendlyMessage } from "@/lib/utils/format";
import { toast } from "@/lib/store/toastStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && token) router.replace("/meetings");
  }, [hydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.warning("Please fill in all fields.", "Missing information");
      return;
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters.", "Missing information");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.warning("Please enter a valid email address.", "Missing information");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.register(fullName.trim(), email.trim(), password);
      setAuth(res.access_token, res.user);
      toast.success("Account created successfully!");
      router.replace("/meetings");
    } catch (err) {
      toast.warning(
        getFriendlyMessage(err, "Registration failed. Please try again."),
        "Registration warning"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-[26px] font-semibold text-ink">Create your account</h1>
      <p className="mt-1.5 text-[14px] text-ink-soft">Join Meetify and never miss a follow-up</p>

      <form onSubmit={handleSubmit} className="mt-7">
        <Input
          label="Full name"
          placeholder="Ahmed Khan"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
