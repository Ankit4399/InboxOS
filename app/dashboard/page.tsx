import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-full bg-cream text-espresso">
      <header className="border-b border-espresso/8 bg-paper/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-terracotta text-xs font-bold text-paper"
              aria-hidden="true"
            >
              I
            </span>
            <div>
              <p className="text-sm font-medium">Dashboard</p>
              <p className="text-xs text-espresso/50">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-espresso/60 transition-colors hover:text-espresso"
            >
              Home
            </Link>
            <Link
              href="/logout"
              className="rounded-lg border border-espresso/12 px-3 py-1.5 text-espresso/70 transition-colors hover:bg-cream"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <div className="rounded-2xl border border-dashed border-espresso/15 bg-paper/50 p-12 text-center">
          <p className="font-display text-2xl text-espresso/80">
            Your inbox lives here soon.
          </p>
          <p className="mt-3 text-sm text-espresso/50">
            Welcome back, {session.user.name}.
          </p>
        </div>
      </main>
    </div>
  );
}
