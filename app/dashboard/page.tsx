import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/index";
import { corsairAccounts, corsairIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import DashboardView from "@/components/dashboard-view";

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
        <div className="mb-10 animate-fade-in-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {session.user.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-espresso/60 mt-1">
              Your centralized workspace for communication and scheduling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGmailConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">
                Gmail Active
              </span>
            )}
            {isCalendarConnected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-1 text-xs font-semibold text-sage">
                Calendar Active
              </span>
            )}
          </div>
        </div>

        {/* Tabbed / Dynamic Main Content */}
        <DashboardView 
          isGmailConnected={isGmailConnected}
          isCalendarConnected={isCalendarConnected}
        />
      </main>
    </div>
  );
}
