"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { signOut } from "@/lib/auth-client";

export default function Logout() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    signOut({
      fetchOptions: {
        onSuccess: () => router.replace("/signin"),
        onError: (ctx) => setError(ctx.error.message ?? "Failed to sign out"),
      },
    });
  }, [router]);

  return (
    <AuthLayout title="Signing out" subtitle="See you soon">
      {error ? (
        <p className="rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-rust">
          {error}
        </p>
      ) : (
        <p className="text-center text-sm text-espresso/55">
          Redirecting you to sign in…
        </p>
      )}
    </AuthLayout>
  );
}
