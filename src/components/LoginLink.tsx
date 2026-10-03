"use client";

import { usePathname } from "next/navigation";

/**
 * Purpose:
 *	The header's "Log in" link for visitors who aren't signed in. Login is optional for browsing, and after
 *	signing in Auth0 brings them back to the page they were on.
 *
 * Args:
 *	(none)
 *
 * Returns:
 *	JSX.Element: a link to /auth/login with returnTo set to the current page
 */
export function LoginLink() {
  const pathname = usePathname();
  return (
    // /auth/login is served by the Auth0 proxy, not a Next.js page, so it needs a plain link (full navigation).
    <a
      href={`/auth/login?returnTo=${encodeURIComponent(pathname || "/")}`}
      className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-current hover:bg-black/5"
    >
      Log in
    </a>
  );
}
