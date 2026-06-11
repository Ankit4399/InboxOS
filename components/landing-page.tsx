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
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-sage animate-fade-in-up">
              Conversational Workspace
            </p>
            <h1 className="font-display text-[2.75rem] font-normal leading-[1.08] tracking-tight sm:text-6xl animate-fade-in-up animation-delay-100">
              Your email & calendar, <br />
              <span className="italic font-light text-terracotta">orchestrated by intent.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-espresso/75 animate-fade-in-up animation-delay-200">
              InboxOS bridges the gap between thoughts and execution. Simply express what you want to achieve, and watch drafts write themselves and schedules coordinate automatically—all within a single calm space.
            </p>

            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center animate-fade-in-up animation-delay-300">
              <LandingActions authenticated={authenticated} />
              {!authenticated && (
                <p className="text-sm text-espresso/55">
                  Free to try. No credit card.
                </p>
              )}
            </div>

            <dl className="mt-14 grid grid-cols-3 gap-4 border-t border-espresso/10 pt-8 sm:gap-8 animate-fade-in-up animation-delay-300">
              <div>
                <dt className="font-display text-2xl text-terracotta">Instant</dt>
                <dd className="mt-1 text-sm text-espresso/65 font-medium">drafts & replies</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-terracotta">Fluid</dt>
                <dd className="mt-1 text-sm text-espresso/65 font-medium">calendar flows</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-terracotta">Zero</dt>
                <dd className="mt-1 text-sm text-espresso/65 font-medium">tab overload</dd>
              </div>
            </dl>
          </div>

          <div className="perspective-1000 transform-style-3d mx-auto w-full max-w-md lg:max-w-none py-6">
            {/* Main Interactive 3D Card Container */}
            <div className="group relative hover-3d-rotate transform-style-3d rounded-2xl border border-espresso/12 bg-paper p-6 shadow-[10px_10px_0_rgba(42,31,26,0.05)] hover:shadow-[18px_18px_0_rgba(42,31,26,0.04)] sm:p-8">
              
              {/* Card Header */}
              <div className="mb-6 flex items-center justify-between border-b border-espresso/8 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-espresso/45">
                    Command Console
                  </span>
                </div>
                <span className="rounded-md bg-terracotta/10 px-2 py-0.5 text-xs font-medium text-terracotta">
                  Active
                </span>
              </div>

              {/* Prompt Input UI */}
              <div className="mb-6 rounded-xl border border-espresso/10 bg-cream/40 p-4 transition-all duration-300 group-hover:border-terracotta/20 group-hover:bg-cream/60">
                <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-espresso/40">
                  <span>Input prompt</span>
                  <span className="font-mono text-sage animate-pulse">Running...</span>
                </div>
                <p className="font-mono text-sm leading-relaxed text-espresso/85">
                  <span className="text-terracotta mr-1.5 font-bold animate-pulse">&gt;</span>
                  Email <span className="underline decoration-honey/60 decoration-2 font-medium">Maya</span> I&apos;m on for <span className="font-semibold text-espresso">3 PM</span>, and block my <span className="underline decoration-sage/60 decoration-2 font-medium">calendar</span>
                </p>
              </div>

              {/* Visual Divider / Flow Line */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-dashed border-espresso/10" />
                </div>
                <span className="relative rounded-full border border-espresso/10 bg-paper px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-espresso/40">
                  Actions Executed
                </span>
              </div>

              {/* Stacked Output Cards with Parallax/Hover offsets */}
              <div className="relative space-y-4 transform-style-3d">
                
                {/* Gmail Draft Card */}
                <div className="animate-float-card border border-espresso/8 bg-cream/35 hover:bg-cream/60 rounded-xl p-4 transition-all duration-500 ease-out shadow-[4px_4px_0_rgba(42,31,26,0.03)] hover:shadow-[8px_8px_0_rgba(42,31,26,0.05)] transform-style-3d group-hover:translate-z-[25px] group-hover:-translate-y-1">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-terracotta" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta">Gmail Draft</span>
                    </div>
                    <span className="rounded bg-terracotta/10 px-1.5 py-0.5 text-[9px] font-medium text-rust font-mono">Created</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-espresso/50"><span className="font-medium text-espresso/70">To:</span> Maya Chen &lt;maya@chen.com&gt;</p>
                    <p className="text-espresso/50"><span className="font-medium text-espresso/70">Subject:</span> Re: Q2 roadmap notes</p>
                    <p className="mt-2 border-t border-espresso/5 pt-2 text-espresso/80 italic font-display text-sm leading-relaxed">
                      &quot;Confirming I&apos;m on for 3 PM today. See you then!&quot;
                    </p>
                  </div>
                </div>

                {/* Google Calendar Card */}
                <div className="animate-float-card-delayed border border-espresso/8 bg-cream/35 hover:bg-cream/60 rounded-xl p-4 transition-all duration-500 ease-out shadow-[4px_4px_0_rgba(42,31,26,0.03)] hover:shadow-[8px_8px_0_rgba(42,31,26,0.05)] transform-style-3d group-hover:translate-z-[15px] group-hover:translate-y-1">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sage" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sage">Google Calendar</span>
                    </div>
                    <span className="rounded bg-sage/15 px-1.5 py-0.5 text-[9px] font-medium text-sage font-mono">Scheduled</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-sm font-semibold text-espresso">Q2 Roadmap Review w/ Maya</p>
                    <div className="flex items-center gap-1.5 text-espresso/60">
                      <svg className="h-3.5 w-3.5 text-espresso/45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Today, 3:00 PM – 3:30 PM</span>
                    </div>
                  </div>
                </div>

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
