import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_NAME = "fbr_session";

export async function GET(req) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json({ user: null });
    }
    try {
      const user = jwt.verify(cookie, JWT_SECRET);
      return NextResponse.json({ user });
    } catch (err) {
      return NextResponse.json({ user: null });
    }
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}