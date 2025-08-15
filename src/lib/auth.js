import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_NAME = "fbr_session";

export function getTokenFromRequest(req) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    if (!cookie) return null;
    const payload = jwt.verify(cookie, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function verifyToken(req) {
  return getTokenFromRequest(req);
}

export function requireAuth(req) {
  const user = getTokenFromRequest(req);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export function requireAdmin(req) {
  const user = getTokenFromRequest(req);
  if (!user || user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export function requireSelfOrAdmin(req, userId) {
  const user = getTokenFromRequest(req);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin" && user.id !== Number(userId)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}


