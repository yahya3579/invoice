import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_NAME = "fbr_session";

// POST /api/auth/refresh - Refresh JWT token with updated user data
export async function POST(req) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    // Get current user data from database
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        fbrApiToken: true
      }
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Create new JWT with updated information
    const newToken = jwt.sign({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      organizationId: currentUser.organizationId,
      fbrApiToken: currentUser.fbrApiToken || null,
    }, JWT_SECRET, { expiresIn: "7d" });
    
    // Set new cookie
    const res = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        organizationId: currentUser.organizationId,
        fbrApiToken: currentUser.fbrApiToken || null,
      }
    });
    
    res.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return res;
    
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json({ 
      error: "Failed to refresh token",
      details: error.message 
    }, { status: 500 });
  }
}
