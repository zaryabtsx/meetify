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

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && token) router.replace("/meetings");
  }, [hydrated, token, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.warning("Please enter both email and password.", "Missing information");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      setAuth(res.access_token, res.user);
      toast.success("Logged in successfully!");
      router.replace("/meetings");
    } catch (err) {
      toast.warning(
        getFriendlyMessage(err, "Login failed. Please check your credentials and try again."),
        "Login warning"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-[26px] font-semibold text-ink">Welcome back</h1>
      <p className="mt-1.5 text-[14px] text-ink-soft">Sign in to your Meetify account</p>

      <form onSubmit={handleSubmit} className="mt-7">
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
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <Button type="submit" loading={loading} fullWidth className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
