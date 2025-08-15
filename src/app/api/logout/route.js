import { NextResponse } from "next/server";

const COOKIE_NAME = "fbr_session";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully." });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}