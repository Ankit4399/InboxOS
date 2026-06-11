import { InboxOSLogo } from "@/components/inboxos-logo";
import { LandingActions } from "@/components/landing-actions";

export function LandingPage({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-cream text-espresso">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-[520px] w-[520px] rounded-full bg-honey/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-80 w-80 rounded-full bg-sage/15 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <InboxOSLogo />
        <LandingActions authenticated={authenticated} variant="header" />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-10">
        <div className="grid flex-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-sage">
              Email, rethought
            </p>
            <h1 className="font-display text-[2.75rem] font-normal leading-[1.08] tracking-tight sm:text-6xl">
              The inbox you&apos;ll{" "}
              <em className="text-terracotta not-italic">actually</em> open.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-espresso/75">
              InboxOS strips away the noise — threads stay readable, replies stay
              fast, and your morning email ritual feels human again.
            </p>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <LandingActions authenticated={authenticated} />
              {!authenticated && (
                <p className="text-sm text-espresso/55">
                  Free to try. No credit card.
                </p>
              )}
            </div>

            <dl className="mt-14 grid grid-cols-3 gap-4 border-t border-espresso/10 pt-8 sm:gap-8">
              <div>
                <dt className="font-display text-2xl text-terracotta">2×</dt>
                <dd className="mt-1 text-sm text-espresso/65">faster triage</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-terracotta">0</dt>
                <dd className="mt-1 text-sm text-espresso/65">tab overload</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-terracotta">1</dt>
                <dd className="mt-1 text-sm text-espresso/65">calm place</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-espresso/10 bg-sand/50"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 translate-x-6 translate-y-6 rounded-2xl border border-espresso/8 bg-sand/30"
              aria-hidden="true"
            />
            <div className="relative rounded-2xl border border-espresso/12 bg-paper p-6 shadow-[8px_8px_0_rgba(42,31,26,0.06)] sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-espresso/8 pb-4">
                <span className="text-xs font-medium uppercase tracking-widest text-espresso/45">
                  Today
                </span>
                <span className="rounded-md bg-sage/15 px-2 py-1 text-xs font-medium text-sage">
                  3 unread
                </span>
              </div>

              <ul className="space-y-3" aria-label="Sample inbox preview">
                {[
                  { from: "Maya Chen", subject: "Q2 roadmap notes", unread: true },
                  { from: "Dev team", subject: "Deploy window tonight", unread: true },
                  { from: "Newsletter", subject: "Weekly digest", unread: false },
                  { from: "You", subject: "Re: contract draft", unread: false },
                ].map((item) => (
                  <li
                    key={item.subject}
                    className={`rounded-lg px-3 py-3 transition-colors ${
                      item.unread
                        ? "bg-terracotta/8 border border-terracotta/15"
                        : "border border-transparent bg-cream/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.from}</p>
                        <p className="mt-0.5 text-sm text-espresso/60">
                          {item.subject}
                        </p>
                      </div>
                      {item.unread && (
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-terracotta"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center gap-2 text-xs text-espresso/45">
                <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
                Sorted by what matters, not what arrived last
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-espresso/8 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-espresso/50">
          <p>InboxOS — built for people who read email.</p>
          <p className="font-display italic text-espresso/40">
            Less clutter. More clarity.
          </p>
        </div>
      </footer>
    </div>
  );
}
