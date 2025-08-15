# Prisma Database Setup Guide

This guide will help you set up your Prisma database with the MySQL schema.

## Prerequisites

1. Make sure you have XAMPP installed and running
2. Ensure MySQL service is started in XAMPP Control Panel
3. Create a database named `fbr_invoice_db` in phpMyAdmin

## Step-by-Step Setup

### 1. Create Database
1. Open XAMPP Control Panel
2. Start Apache and MySQL services
3. Click "Admin" next to MySQL (opens phpMyAdmin)
4. Create a new database named `fbr_invoice_db`

### 2. Environment Configuration
1. Create a `.env` file in the root directory (invoice folder)
2. Add the following content:

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/fbr_invoice_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret-here"
```

**Note:** 
- Replace `root` with your MySQL username if different
- Add password after `:` if you have set one
- Change `3306` if you're using a different MySQL port

### 3. Install Dependencies
Run this command in your terminal (in the invoice directory):

```bash
npm install
```

### 4. Generate Prisma Client
Run this command to generate the Prisma client:

```bash
npx prisma generate
```

### 5. Push Schema to Database
Run this command to create the tables in your database:

```bash
npx prisma db push
```

### 6. Verify Setup
Run this command to open Prisma Studio and verify your database:

```bash
npx prisma studio
```

## Database Schema Overview

The schema includes the following models:

1. **User** - User accounts with roles and organization associations
2. **Organization** - Business organizations with NTN and subscription details
3. **Invoice** - Invoice records with FBR integration
4. **InvoiceItem** - Individual items within invoices
5. **ErrorLog** - Error logging for debugging

## Key Features

- **Relationships**: Proper foreign key relationships between all tables
- **Indexes**: Optimized indexes for frequently queried fields
- **Enums**: Type-safe enums for status fields
- **Timestamps**: Automatic created_at and updated_at timestamps
- **Cascade Deletes**: Invoice items are deleted when invoice is deleted

## Usage in Your Application

Import the Prisma client in your components/API routes:

```javascript
import { prisma } from '@/lib/prisma'

// Example: Get all users
const users = await prisma.user.findMany({
  include: {
    organization: true
  }
})

// Example: Create a new invoice
const invoice = await prisma.invoice.create({
  data: {
    userId: 1,
    organizationId: 1,
    invoiceNumber: "INV-001",
    buyerName: "John Doe",
    invoiceDate: new Date(),
    subtotal: 1000.00,
    taxAmount: 150.00,
    totalAmount: 1150.00,
    currency: "PKR"
  }
})
```

## Troubleshooting

### Common Issues:

1. **Connection Refused**: Make sure MySQL is running in XAMPP
2. **Database Not Found**: Create the database in phpMyAdmin first
3. **Permission Denied**: Check your MySQL username/password in DATABASE_URL
4. **Port Issues**: Verify MySQL is running on port 3306

### Reset Database:
If you need to reset your database:

```bash
npx prisma db push --force-reset
```

### View Database:
To view your database in a GUI:

```bash
npx prisma studio
```

## Next Steps

1. Set up authentication with NextAuth.js
2. Create API routes for CRUD operations
3. Build your invoice management interface
4. Integrate with FBR API for invoice registration

## Support

If you encounter any issues:
1. Check the Prisma documentation: https://www.prisma.io/docs
2. Verify your MySQL connection settings
3. Ensure all environment variables are correctly set 