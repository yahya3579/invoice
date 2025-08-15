# Database Migration Guide

## Adding originalPassword Field

To implement the forgot password functionality with original password storage, you need to run a database migration.

### Step 1: Generate Migration

```bash
npx prisma migrate dev --name add_original_password_field
```

### Step 2: Apply Migration

The migration will automatically be applied. If you need to apply it manually:

```bash
npx prisma migrate deploy
```

### Step 3: Update Existing Users

After the migration, you'll need to populate the `originalPassword` field for existing users. We've provided a script to help with this:

#### Option A: Use the Provided Script (Recommended)
```bash
# Navigate to the scripts directory
cd scripts

# Option 1: Populate original passwords (assumes current passwords are original)
node populate-original-passwords.js populate

# Option 2: Set a default password for all users
node populate-original-passwords.js default

# Option 3: Update a specific user
node populate-original-passwords.js update user@example.com newpassword123
```

#### Option B: Manual Database Update
```sql
-- Update specific user
UPDATE users SET original_password = 'userpassword123' WHERE email = 'user@example.com';

-- Update all users with a default password
UPDATE users SET original_password = 'ChangeMe123!' WHERE original_password IS NULL;
```

#### Option C: Use the Admin API
Use the updated admin users API to create new users with proper password hashing and original password storage.

### Step 4: Update User Registration

Make sure your user registration process also stores the original password:

```javascript
// In your user registration API
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

### Step 5: Verify Migration

Check that the field was added correctly:

```bash
npx prisma db pull
npx prisma generate
```

## Important Notes

⚠️ **Security Consideration**: Storing original passwords is less secure than hashed passwords only. Consider:
- Encrypting the `originalPassword` field
- Implementing password reset tokens instead
- Using temporary password generation

## Alternative Approach

If you prefer not to store original passwords, consider implementing Option 2 (temporary passwords) or Option 3 (reset tokens) from the setup guide.
