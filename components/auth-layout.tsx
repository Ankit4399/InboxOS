import type { ReactNode } from "react";
import { InboxOSLogo } from "@/components/inboxos-logo";

export const authInputClass =
  "w-full rounded-lg border border-espresso/12 bg-cream/40 px-3 py-2.5 text-sm text-espresso outline-none transition-colors placeholder:text-espresso/35 focus:border-terracotta/40 focus:bg-paper focus:ring-2 focus:ring-terracotta/10";

export const authPrimaryButtonClass =
  "flex h-11 w-full items-center justify-center rounded-lg bg-terracotta text-sm font-medium text-paper shadow-[0_2px_0_#9b3d24] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0";

export const authSecondaryButtonClass =
  "flex h-11 w-full items-center justify-center rounded-lg border border-espresso/12 bg-paper/60 text-sm font-medium text-espresso transition-colors hover:bg-paper";

export function AuthDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-espresso/10" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-widest">
        <span className="bg-paper px-3 text-espresso/40">or</span>
      </div>
    </div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-cream text-espresso">
      <div
        className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-honey/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-sage/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="relative w-full max-w-[400px]">
          <div
            className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-espresso/8 bg-sand/40"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl border border-espresso/6 bg-sand/25"
            aria-hidden="true"
          />

          <div className="relative space-y-7 rounded-2xl border border-espresso/12 bg-paper p-8 shadow-[6px_6px_0_rgba(42,31,26,0.05)] sm:p-9">
            <div className="flex flex-col items-center gap-5 text-center">
              <InboxOSLogo />
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-normal tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-espresso/55">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="space-y-5">{children}</div>
          </div>
        </div>

        <p className="relative z-10 mt-8 font-display text-sm italic text-espresso/35">
          Less clutter. More clarity.
        </p>
      </div>
    </div>
  );
}
