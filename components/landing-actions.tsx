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
        className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-paper shadow-[0_2px_0_#9b3d24] transition-transform hover:-translate-y-0.5 active:translate-y-0"
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
        className="text-sm font-medium text-espresso/70 transition-colors hover:text-espresso"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/signup"
        className="inline-flex items-center rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-paper shadow-[0_2px_0_#9b3d24] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Get started
      </Link>
      <Link
        href="/signin"
        className="inline-flex items-center rounded-lg border border-espresso/15 bg-paper/60 px-5 py-2.5 text-sm font-medium text-espresso transition-colors hover:bg-paper"
      >
        Sign in
      </Link>
    </div>
  );
}
