import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/index";
import { corsairAccounts, corsairIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  // Query connected integrations for the current user
  const userAccounts = await db
    .select({
      id: corsairAccounts.id,
      integrationName: corsairIntegrations.name,
      createdAt: corsairAccounts.createdAt,
    })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id)
    )
    .where(eq(corsairAccounts.tenantId, session.user.id));

  const isGmailConnected = userAccounts.some(acc => acc.integrationName === 'gmail');
  const isCalendarConnected = userAccounts.some(acc => acc.integrationName === 'googlecalendar');
  const hasAnyConnection = userAccounts.length > 0;

  if (!hasAnyConnection) {
    redirect("/dashboard/connect-google");
  }

  return (
    <div className="min-h-screen bg-cream text-espresso">
      {/* Premium Header with backdrop blur and sticky position */}
      <header className="border-b border-espresso/8 bg-paper/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rust to-terracotta text-sm font-bold text-paper shadow-sm"
              aria-hidden="true"
            >
              I
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">InboxOS</p>
              <p className="text-xs text-espresso/50">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-espresso/60 transition-colors hover:text-espresso font-medium"
            >
              Home
            </Link>
            <Link
              href="/dashboard/connect-google"
              className="inline-flex items-center gap-1.5 rounded-lg bg-espresso px-3 py-1.5 font-medium text-paper hover:bg-terracotta transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Connect
            </Link>
            <Link
              href="/logout"
              className="text-espresso/60 transition-colors hover:text-espresso font-medium"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        {/* Welcome Banner */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {session.user.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-espresso/60 mt-1">
            Here's a summary of your connected channels and messages.
          </p>
        </div>

        {/* Integration Status Section */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {/* Gmail Status */}
          {isGmailConnected ? (
            <div className="rounded-2xl border border-espresso/12 bg-paper p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up animation-delay-100">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-lg">Gmail Inbox</h3>
              <p className="text-xs text-espresso/60 mt-1">
                Your email messages are live syncing and ready to process.
              </p>
              <div className="mt-6 border-t border-espresso/8 pt-4 flex items-center justify-between text-xs">
                <span className="text-espresso/50">Status: OK</span>
                <Link href="/dashboard/connect-google" className="text-terracotta font-medium hover:underline">
                  Manage
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-espresso/15 bg-paper/40 p-6 flex flex-col justify-between hover:border-terracotta/40 transition-all animate-fade-in-up animation-delay-100">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-espresso/5 text-espresso/40">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-lg text-espresso/80">Gmail Inbox</h3>
                <p className="text-xs text-espresso/50 mt-1">
                  Connect your Google Mail to start receiving and managing emails.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/dashboard/connect-google" className="inline-flex w-full items-center justify-center rounded-lg bg-espresso/5 px-3 py-2 text-xs font-semibold text-espresso hover:bg-terracotta hover:text-paper transition-colors">
                  Connect Gmail
                </Link>
              </div>
            </div>
          )}

          {/* Calendar Status */}
          {isCalendarConnected ? (
            <div className="rounded-2xl border border-espresso/12 bg-paper p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up animation-delay-200">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10 text-sage">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                  </svg>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-lg">Google Calendar</h3>
              <p className="text-xs text-espresso/60 mt-1">
                Your schedule blocks are syncing and available for AI assistance.
              </p>
              <div className="mt-6 border-t border-espresso/8 pt-4 flex items-center justify-between text-xs">
                <span className="text-espresso/50">Status: OK</span>
                <Link href="/dashboard/connect-google" className="text-sage font-medium hover:underline">
                  Manage
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-espresso/15 bg-paper/40 p-6 flex flex-col justify-between hover:border-sage/40 transition-all animate-fade-in-up animation-delay-200">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-espresso/5 text-espresso/40">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-semibold text-lg text-espresso/80">Google Calendar</h3>
                <p className="text-xs text-espresso/50 mt-1">
                  Connect your Google Calendar to sync meetings and schedules.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/dashboard/connect-google" className="inline-flex w-full items-center justify-center rounded-lg bg-espresso/5 px-3 py-2 text-xs font-semibold text-espresso hover:bg-sage hover:text-paper transition-colors">
                  Connect Calendar
                </Link>
              </div>
            </div>
          )}

          {/* Quick Stats Card */}
          <div className="rounded-2xl border border-espresso/12 bg-paper p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up animation-delay-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-honey/10 text-honey">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-lg">System Status</h3>
            <p className="text-xs text-espresso/60 mt-1">
              InboxOS agent engines are powered up and operating normally.
            </p>
            <div className="mt-6 border-t border-espresso/8 pt-4 flex items-center justify-between text-xs">
              <span className="text-espresso/50">Version: 0.1.0</span>
              <span className="text-honey font-semibold">Ready</span>
            </div>
          </div>
        </div>

        {/* Mock/Placeholder Inbox Section to show beautiful workspace */}
        <div className="rounded-2xl border border-espresso/12 bg-paper p-8 shadow-sm animate-fade-in-up animation-delay-300">
          <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold">Your Inbox</h2>
              <p className="text-xs text-espresso/50 mt-0.5">Mock inbox view showing incoming messages</p>
            </div>
            <span className="rounded-lg bg-cream px-2 py-1 text-xs font-semibold text-espresso/80">
              0 Unread
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-cream/30 border border-espresso/5 hover:bg-cream/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-terracotta/20 flex items-center justify-center text-xs font-bold text-terracotta">
                  G
                </div>
                <div>
                  <p className="text-sm font-semibold">Google Cloud Platform</p>
                  <p className="text-xs text-espresso/60">OAuth consent screen verification status update...</p>
                </div>
              </div>
              <span className="text-xs text-espresso/40">10 mins ago</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-cream/30 border border-espresso/5 hover:bg-cream/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center text-xs font-bold text-sage">
                  C
                </div>
                <div>
                  <p className="text-sm font-semibold">Corsair Dev</p>
                  <p className="text-xs text-espresso/60">Welcome to your integration environment...</p>
                </div>
              </div>
              <span className="text-xs text-espresso/40">1 hour ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
