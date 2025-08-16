import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/fbr/error-codes - Get FBR error codes and messages
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const codes = searchParams.get("codes"); // Comma-separated list of error codes
    
    let where = { isActive: true };
    
    if (codes) {
      const codeArray = codes.split(',').map(code => code.trim());
      where.code = { in: codeArray };
    }
    
    const errorCodes = await prisma.fbrErrorCode.findMany({
      where,
      select: {
        code: true,
        message: true,
        briefDescription: true,
        category: true
      },
      orderBy: { code: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      data: errorCodes
    });
  } catch (e) {
    console.error("Error fetching FBR error codes:", e);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch FBR error codes" 
    }, { status: 500 });
  }
}
