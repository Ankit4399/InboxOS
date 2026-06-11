import Link from "next/link";

type LandingActionsProps = {
  authenticated: boolean;
  variant?: "header" | "hero";
};

export function LandingActions({
  authenticated,
  variant = "hero",
}: LandingActionsProps) {
  if (authenticated) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-terracotta to-rust px-6 py-3 text-sm font-medium text-paper shadow-md shadow-terracotta/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-terracotta/35 active:translate-y-0"
      >
        Open dashboard
        <span aria-hidden="true">→</span>
      </Link>
    );
  }

  if (variant === "header") {
    return (
      <Link
        href="/signin"
        className="text-sm font-medium text-espresso/70 transition-colors hover:text-espresso hover:underline decoration-terracotta decoration-2 underline-offset-4"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-terracotta to-rust px-6 py-3 text-sm font-medium text-paper shadow-md shadow-terracotta/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-terracotta/35 active:translate-y-0"
      >
        Get started
      </Link>
      <Link
        href="/signin"
        className="inline-flex items-center justify-center rounded-lg border border-espresso/12 bg-paper/70 px-6 py-3 text-sm font-medium text-espresso shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-paper hover:border-espresso/25 hover:shadow-md active:translate-y-0"
      >
        Sign in
      </Link>
    </div>
  );
}
