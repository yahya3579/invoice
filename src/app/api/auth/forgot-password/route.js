import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configure email transporter (you'll need to set these environment variables)
const transporter = nodemailer.createTransport({
  service: "gmail", // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
});

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Import Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Query database to find user with original password using raw SQL
    // This bypasses Prisma schema validation for now
    const users = await prisma.$queryRaw`
      SELECT email, original_password as originalPassword, name 
      FROM users 
      WHERE email = ${email}
    `;
    
    const user = users[0]; // Get first result

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: "Email not found in our system" },
        { status: 404 }
      );
    }

    // Check if user has an original password
    if (!user.originalPassword) {
      return NextResponse.json(
        { error: "No original password available for this user. The original_password column may not exist yet. Please run the database migration first." },
        { status: 404 }
      );
    }

    // Email template that matches your project's design
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TXS Digital Marketing - Password Recovery</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          .logo-icon {
            width: 40px;
            height: 40px;
            background: #3b82f6;
            border-radius: 8px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-text {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
          }
          .title {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #334155;
            margin-bottom: 20px;
          }
          .password-box {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 30px 0;
          }
          .password-label {
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .password-value {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            background: rgba(255, 255, 255, 0.1);
            padding: 12px 20px;
            border-radius: 8px;
            border: 2px dashed rgba(255, 255, 255, 0.3);
          }
          .info {
            background-color: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .info-title {
            color: #1e40af;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .info-text {
            color: #1e40af;
            font-size: 14px;
            line-height: 1.5;
          }
          .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            color: #64748b;
            font-size: 14px;
            margin: 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
          }
          .button:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <div class="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="logo-text">TXS Digital Marketing</span>
            </div>
            <h1 class="title">Password Recovery</h1>
          </div>
          
                     <div class="content">
             <p class="greeting">Hello ${user.name || 'there'},</p>
            
            <p style="color: #334155; line-height: 1.6; margin-bottom: 20px;">
              We received a request to recover your password for your TXS Digital Marketing account. 
              Here are your account credentials:
            </p>
            
                         <div class="password-box">
               <div class="password-label">Your Password</div>
               <div class="password-value">${user.originalPassword}</div>
             </div>
            
            <div class="info">
              <div class="info-title">🔐 Security Note</div>
              <div class="info-text">
                For security reasons, we recommend changing your password after logging in. 
                You can do this in your account settings.
              </div>
            </div>
            
                         <div style="text-align: center; margin: 30px 0;">
               <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button" style="color: white;">
                 Sign In to Your Account
               </a>
             </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              If you didn't request this password recovery, please ignore this email. 
              Your account security is important to us.
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              © 2024 TXS Digital Marketing. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "TXS Digital Marketing - Password Recovery",
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    // Close Prisma connection
    await prisma.$disconnect();

    return NextResponse.json(
      { message: "Password sent successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Forgot password error:", error);
    
    // Close Prisma connection on error
    if (prisma) {
      await prisma.$disconnect();
    }
    
    return NextResponse.json(
      { error: "Failed to send password. Please try again." },
      { status: 500 }
    );
  }
}
