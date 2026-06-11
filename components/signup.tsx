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
import { signIn, signUp } from "@/lib/auth-client";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await signUp.email(
      { name, email, password, callbackURL: "/" },
      {
        onSuccess: () => router.push("/"),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Failed to sign up");
          setLoading(false);
        },
      },
    );
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    await signIn.social(
      { provider: "google", callbackURL: "/" },
      {
        onError: (ctx) =>
          setError(ctx.error.message ?? "Failed to sign up with Google"),
      },
    );
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start with a calmer inbox">
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-espresso/80">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className={authInputClass}
          />
        </div>
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
            placeholder="Min. 8 characters"
            required
            minLength={8}
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
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <AuthDivider />

      <button
        type="button"
        onClick={handleGoogleSignUp}
        className={authSecondaryButtonClass}
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-espresso/55">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-terracotta transition-colors hover:text-rust"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
