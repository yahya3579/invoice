import { NextResponse } from "next/server";

const COOKIE_NAME = "fbr_session";

function decodeJwtRole(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return payload?.role || null;
  } catch {
    // Fallback for Edge/runtime without Buffer
    try {
      const base64 = token.split(".")[1];
      const json = atob(base64);
      const payload = JSON.parse(json);
      return payload?.role || null;
    } catch {
      return null;
    }
  }
}

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token);
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/user");
  const isLogin = pathname === "/login";

  // If accessing protected routes without auth → redirect to login
  if (isProtected && !isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If on /login and already authenticated → send to role dashboard
  if (isLogin && isAuthenticated) {
    const role = decodeJwtRole(token);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = role === "admin" ? "/admin" : "/user";
    return NextResponse.redirect(redirectUrl);
  }

  // Enforce admin-only access to /admin
  if (pathname.startsWith("/admin") && isAuthenticated) {
    const role = decodeJwtRole(token);
    if (role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/user";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/login"],
};


