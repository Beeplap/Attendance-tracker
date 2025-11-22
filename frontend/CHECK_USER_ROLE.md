# How to Check and Fix User Role

## Problem
You're logging in with an admin email but being redirected to the teacher dashboard. This means the user's role in the database is set to "teacher" instead of "admin".

## Solution 1: Check Current Role in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor** → **users** table
3. Find your user by email
4. Check the `role` column - it's probably set to `teacher` or `staff`

## Solution 2: Update Role via SQL

Run this SQL in Supabase SQL Editor (replace with your email):

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

## Solution 3: Update Role via API

You can also update the role by calling the students API (if you have admin access) or directly in Supabase.

## Solution 4: Recreate User with Correct Role

If the user was created incorrectly, delete and recreate:

```sql
-- First, get the user ID from auth.users
-- Then delete from users table
DELETE FROM users WHERE email = 'your-admin-email@example.com';

-- Then recreate via /api/add endpoint with role: 'admin'
```

## Debug: Check What Role is Being Retrieved

After the fix, check the browser console when logging in. You should see:
```
User role: admin Email: your-email@example.com
```

If you see "teacher" or something else, the database still has the wrong role.

