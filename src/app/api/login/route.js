import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const COOKIE_NAME = "fbr_session";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    
    console.log(`Login attempt for email: ${email}`);
    
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: "Database connection error." }, { status: 500 });
    }
    
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    
    console.log(`User found: ${user.email}, password type: ${typeof user.password}, starts with $2: ${user.password?.startsWith('$2')}`);
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }
    // Check if password is hashed (starts with $2a$ or $2b$ or $2y$)
    let valid = false;
    const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'));
    
    if (isHashed) {
      // Compare with hashed password
      console.log(`Comparing hashed password for user: ${user.email}`);
      valid = await bcrypt.compare(password, user.password);
      console.log(`Password comparison result: ${valid}`);
    } else {
      // Fallback for plaintext passwords (should not happen in production)
      console.log(`Comparing plaintext password for user: ${user.email}`);
      valid = password === user.password;
      console.log(`Plaintext comparison result: ${valid}`);
      console.warn(`User ${user.email} has plaintext password - should be hashed`);
    }
    
    if (!valid) {
      console.log(`Login failed for user: ${user.email} - invalid password`);
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    console.log(`Login successful for user: ${user.email}`);
    
    // Create JWT
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    }, JWT_SECRET, { expiresIn: "7d" });
    // Set cookie
    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
      message: "Login successful."
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}
