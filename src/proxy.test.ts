import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuth0, isAuthConfigured } from "@/lib/auth0";
import { proxy } from "./proxy";

vi.mock("@/lib/auth0", () => ({
  isAuthConfigured: vi.fn(),
  getAuth0: vi.fn(),
}));

const authResponse = NextResponse.next({ headers: { "x-from-auth0": "yes" } });
const auth0 = {
  middleware: vi.fn(async () => authResponse),
  getSession: vi.fn(),
};

beforeEach(() => {
  vi.mocked(isAuthConfigured).mockReturnValue(true);
  vi.mocked(getAuth0).mockReturnValue(auth0 as unknown as ReturnType<typeof getAuth0>);
  auth0.getSession.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const request = (path: string) => new NextRequest(`http://localhost:3000${path}`);

describe("proxy", () => {
  it("lets Auth0 handle its own routes", async () => {
    const res = await proxy(request("/auth/callback?code=abc"));
    expect(res).toBe(authResponse);
    expect(auth0.getSession).not.toHaveBeenCalled();
  });

  it("lets logged-out visitors browse every public page and API without asking them to log in", async () => {
    for (const path of ["/", "/receipt", "/spending", "/spending/data-fin-buv11-2024", "/campaigns", "/campaigns/new", "/campaigns/abc", "/petitions", "/admin", "/api/breakdown", "/api/spending", "/api/me"]) {
      const res = await proxy(request(path));
      expect(res, path).toBe(authResponse);
    }
    // Routes check login themselves (401 from requireUser, 404 from requireAdmin), so the proxy doesn't need the session.
    expect(auth0.getSession).not.toHaveBeenCalled();
  });

  it("sends logged-out visitors to login on a starter's own pages, keeping the page to return to", async () => {
    for (const path of ["/campaigns/abc/edit", "/campaigns/abc/live"]) {
      const res = await proxy(request(`${path}?from=story`));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/auth/login");
      expect(location.searchParams.get("returnTo")).toBe(`${path}?from=story`);
    }
  });

  it("lets logged-in starters open their own pages", async () => {
    auth0.getSession.mockResolvedValue({ user: { sub: "auth0|alice" } });
    const res = await proxy(request("/campaigns/abc/edit"));
    expect(res).toBe(authResponse);
  });

  it("lets everything through in development when Auth0 is not configured", async () => {
    vi.mocked(isAuthConfigured).mockReturnValue(false);
    vi.stubEnv("NODE_ENV", "development");
    const res = await proxy(request("/api/me"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("fails with 500 in production when Auth0 is not configured", async () => {
    vi.mocked(isAuthConfigured).mockReturnValue(false);
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await proxy(request("/"));
    expect(res.status).toBe(500);
  });
});
