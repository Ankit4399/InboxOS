import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (formerly middleware) for centralized route protection.
 *
 * This performs an optimistic cookie check — it verifies the session cookie
 * exists but doesn't validate it against the database. The actual session
 * validation still happens server-side in protected page components.
 *
 * This guards the entire /dashboard segment so new sub-pages (e.g.
 * /dashboard/settings, /dashboard/analytics) are automatically protected
 * without per-page redirect logic.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
