import { NextResponse, type NextRequest } from "next/server";
import { isDevBypass } from "@/lib/auth";
import { getAuth0, isAuthConfigured } from "@/lib/auth0";

// Browsing needs no account: the receipt, stories, campaigns and petitions are public. Sign-in is asked for only
// when someone acts. API routes check that themselves (requireUser / requireAdmin answer 401 / 404), and clicking
// Join or Start while logged out goes to the login page through apiFetch. Only the starter's own pages below send a
// logged-out visitor straight to login.
const STARTER_PAGES = [/^\/campaigns\/[^/]+\/(edit|live)\/?$/];

/**
 * Purpose:
 *	Run Auth0 on every request (its /auth/* routes and the rolling session cookie), and send logged-out visitors
 *	to login only on pages that belong to a campaign's starter.
 *
 * Args:
 *	- request: the incoming request
 *
 * Returns:
 *	Promise<NextResponse>: Auth0's response, a redirect to /auth/login with returnTo, or 500 when Auth0 is missing in production
 */
export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) {
    if (isDevBypass()) return NextResponse.next();
    console.error("Auth0 is not configured");
    return new NextResponse("Auth0 is not configured", { status: 500 });
  }

  const auth0 = getAuth0();
  const authResponse = await auth0.middleware(request);
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/auth/") || !STARTER_PAGES.some((page) => page.test(pathname))) return authResponse;

  if (await auth0.getSession(request)) return authResponse;
  const login = new URL("/auth/login", request.nextUrl.origin);
  login.searchParams.set("returnTo", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
