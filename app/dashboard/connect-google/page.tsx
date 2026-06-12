import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ConnectGooglePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-cream text-espresso">
      <header className="border-b border-espresso/8 bg-paper/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-terracotta text-xs font-bold text-paper"
              aria-hidden="true"
            >
              I
            </span>
            <div>
              <p className="text-sm font-medium">Connect Integrations</p>
              <p className="text-xs text-espresso/50">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-espresso/60 transition-colors hover:text-espresso"
            >
              Dashboard
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

      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Link Google Services
          </h1>
          <p className="mt-4 text-base text-espresso/60">
            Grant permission to synchronize your inbox and schedule. Everything is stored securely and processed safely.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Gmail Card */}
          <div className="group relative rounded-2xl border border-espresso/12 bg-paper p-8 transition-all hover:border-terracotta/40 hover:shadow-lg animate-fade-in-up animation-delay-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
              {/* Mail Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="mt-6 font-display text-xl font-medium">Google Mail</h2>
            <p className="mt-2 text-sm text-espresso/60">
              Import and read messages, process updates, and organize your conversations seamlessly.
            </p>
            <div className="mt-8">
              <a
                href="/api/connect?plugin=gmail"
                className="inline-flex w-full items-center justify-center rounded-lg bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-terracotta transition-colors shadow-sm"
              >
                Connect Gmail
              </a>
            </div>
          </div>

          {/* Google Calendar Card */}
          <div className="group relative rounded-2xl border border-espresso/12 bg-paper p-8 transition-all hover:border-sage/40 hover:shadow-lg animate-fade-in-up animation-delay-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage/10 text-sage">
              {/* Calendar Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
              </svg>
            </div>
            <h2 className="mt-6 font-display text-xl font-medium">Google Calendar</h2>
            <p className="mt-2 text-sm text-espresso/60">
              Sync upcoming meetings, schedule blocks, and coordinate events directly inside your workspace.
            </p>
            <div className="mt-8">
              <a
                href="/api/connect?plugin=googlecalendar"
                className="inline-flex w-full items-center justify-center rounded-lg bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-sage transition-colors shadow-sm"
              >
                Connect Calendar
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
