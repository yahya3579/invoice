import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";

// GET /api/fbr/check-token - Check if current user has FBR token configured
export async function GET(req) {
  const user = getTokenFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({
      success: true,
      hasToken: !!user.fbrApiToken,
      message: user.fbrApiToken 
        ? "FBR API token is configured" 
        : "FBR API token is not configured"
    });
  } catch (error) {
    console.error("Error checking FBR token:", error);
    return NextResponse.json({ 
      error: "Failed to check FBR token status" 
    }, { status: 500 });
  }
}
