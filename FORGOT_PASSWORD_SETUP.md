# Forgot Password Setup Guide

## Overview
This project includes a forgot password functionality that sends the user's password via email. Since passwords are stored unhashed in the database, the system retrieves and sends the actual password.

## Setup Requirements

### 1. Install Dependencies
```bash
npm install nodemailer
```

### 2. Environment Variables
Create a `.env.local` file in your project root with the following variables:

```env
# Email Configuration for Forgot Password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# App URL (optional - defaults to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Email Service Configuration

#### For Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS`

#### For Other Email Services:
Update the transporter configuration in `/src/app/api/auth/forgot-password/route.js`:

```javascript
const transporter = nodemailer.createTransporter({
  service: "your-service", // e.g., "outlook", "yahoo"
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

### 4. Database Integration

#### Schema Update
The system now uses an `originalPassword` field in the User model to store unhashed passwords for recovery.

#### Database Migration
Run the following command to add the new field:

```bash
npx prisma migrate dev --name add_original_password_field
```

#### API Implementation
The forgot password API now queries the database for the user's original password:

```javascript
const user = await prisma.user.findUnique({
  where: { email },
  select: {
    email: true,
    originalPassword: true,
    name: true
  }
});

if (!user || !user.originalPassword) {
  return NextResponse.json(
    { error: "Email not found or no password available for recovery" },
    { status: 404 }
  );
}
```

#### User Registration Update
Ensure your user registration process stores both hashed and original passwords:

```javascript
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,        // Store hashed password
    originalPassword: plainPassword,  // Store original password
    name,
    role
  }
});
```

## Features

### UI Components
- **Forgot Password Page**: `/forgot-password`
- **Email Input Form**: Clean, responsive design matching your project theme
- **Success State**: Confirmation screen with next steps
- **Error Handling**: Toast notifications for various error states

### Email Template
- **Professional Design**: Matches your project's visual identity
- **Responsive Layout**: Works on all email clients
- **Branded Elements**: TXS Digital Marketing logo and colors
- **Clear Information**: Password display with security notes

### User Experience
- **Loading States**: Visual feedback during email sending
- **Form Validation**: Email format validation
- **Navigation**: Easy access to login page and home
- **Responsive Design**: Works on all device sizes

## Usage

1. User clicks "Forgot password?" on login page
2. User enters their registered email address
3. System validates email and sends password via email
4. User receives professionally formatted email with their password
5. User can return to login page to sign in

## Security Notes

⚠️ **Important**: This system sends passwords in plain text via email. Consider implementing:
- Password hashing for future versions
- Temporary password generation
- Password reset tokens with expiration
- Rate limiting for password requests

## Customization

### Email Template
The email template is fully customizable in `/src/app/api/auth/forgot-password/route.js`. You can modify:
- Colors and branding
- Layout and typography
- Content and messaging
- Call-to-action buttons

### UI Styling
The forgot password page uses the same design system as your login and landing pages:
- Tailwind CSS classes
- Consistent color scheme
- Matching typography
- Same component library

## Troubleshooting

### Common Issues
1. **Email not sending**: Check environment variables and email service credentials
2. **Authentication errors**: Verify app passwords for Gmail or service-specific settings
3. **Database connection**: Ensure your database query is working correctly
4. **Email delivery**: Check spam folders and email service logs

### Testing
Test the functionality with:
- Valid email addresses
- Invalid email formats
- Non-existent emails
- Various email clients (Gmail, Outlook, etc.)
