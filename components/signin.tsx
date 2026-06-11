"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthDivider,
  AuthLayout,
  authInputClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from "@/components/auth-layout";
import { signIn } from "@/lib/auth-client";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await signIn.email(
      { email, password, callbackURL: "/" },
      {
        onSuccess: () => router.push("/"),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Failed to sign in");
          setLoading(false);
        },
      },
    );
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    await signIn.social(
      { provider: "google", callbackURL: "/" },
      {
        onError: (ctx) =>
          setError(ctx.error.message ?? "Failed to sign in with Google"),
      },
    );
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your inbox">
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-espresso/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={authInputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-espresso/80">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={authInputClass}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-rust">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClass}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <AuthDivider />

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className={authSecondaryButtonClass}
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-espresso/55">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-terracotta transition-colors hover:text-rust"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
