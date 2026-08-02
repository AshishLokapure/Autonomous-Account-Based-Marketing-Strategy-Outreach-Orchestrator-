import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"];

/**
 * Throttle interval for getUser() calls (in milliseconds).
 * Supabase's getUser() makes a live round-trip to verify/refresh the session.
 * Calling it on every navigation causes refresh-token races when the user
 * clicks rapidly (e.g. sidebar links), because Supabase rotates the refresh
 * token on each call — a second concurrent call with the now-stale token fails
 * and the middleware incorrectly treats the user as signed-out.
 *
 * We throttle to once per 55 seconds (access tokens default to 60 s lifetime)
 * and fall back to getSession() (local cookie check, no network) in between.
 */
const AUTH_CHECK_INTERVAL_MS = 55_000;
const AUTH_CHECK_COOKIE = "_ap_last_auth_check";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // --- Determine whether we need a full getUser() round-trip ---
  const lastCheck = parseInt(request.cookies.get(AUTH_CHECK_COOKIE)?.value || "0", 10);
  const now = Date.now();
  const needsFreshCheck = now - lastCheck > AUTH_CHECK_INTERVAL_MS;

  let user: { id: string } | null = null;

  if (needsFreshCheck) {
    // Full round-trip — refreshes tokens if needed.  IMPORTANT: do not remove.
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      // Record the timestamp so subsequent rapid navigations skip the round-trip
      supabaseResponse.cookies.set(AUTH_CHECK_COOKIE, String(now), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour — just a cache, not security-critical
      });
    }
  } else {
    // Between throttle windows: trust the local session cookie (no network call).
    // getSession() only reads the cookie — it cannot cause a refresh-token race.
    const { data } = await supabase.auth.getSession();
    user = data.session?.user ?? null;
  }

  // --- Fallback: if getUser() returned null but a session cookie exists,
  //     the failure is almost certainly a transient refresh-token race.
  //     Don't kick the user out — let the page load and let the client-side
  //     Supabase SDK retry the refresh in a non-racing context. ---
  if (!user && needsFreshCheck) {
    const { data: fallback } = await supabase.auth.getSession();
    if (fallback.session?.user) {
      user = fallback.session.user;
    }
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
