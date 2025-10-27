# How to Fix Admin Access Issue

## ⚠️ IMPORTANT: You're looking at the wrong table!

The screenshot shows `auth.users` table with `role: authenticated`. **This is NOT the role we need!**

Our app uses the **`profiles` table** (not `auth.users`) to store custom roles like `admin`, `teacher`, `student`.

## The Problem
The `id` field in the `profiles` table must match the user's ID from the `auth.users` table. AND the `role` field in `profiles` must be `admin`.

## Solution Options

### Option 1: Update the existing profile (Recommended)
1. Go to your Supabase dashboard
2. Check the `auth.users` table
3. Find the user with email `admin@admin.com`
4. Copy the `id` (UUID)
5. Go to the `profiles` table
6. Update the row with email `admin@admin.com` and set the `id` field to match the UUID from `auth.users`

### Option 2: Delete and recreate (if myRole=undefined also)
1. In Supabase, go to Authentication > Users
2. Find and delete the user with `admin@admin.com` (if it exists)
3. Go back to your website
4. As a super admin (or manually in database), add a new user with:
   - Email: `admin@admin.com`
   - Password: your password
   - Role: `admin`
   - This will automatically create the profile with the correct ID

### Option 3: Quick fix using SQL (Fastest)

**Step 1:** First, find your auth user ID. Run this:
```sql
SELECT id, email FROM auth.users WHERE email = 'admin@admin.com';
```

Copy the `id` value (the UUID).

**Step 2:** Then update the profile with that ID:
```sql
-- Replace 'PASTE_THE_UUID_HERE' with the actual ID you copied
UPDATE profiles 
SET id = 'PASTE_THE_UUID_HERE'::uuid
WHERE email = 'admin@admin.com';
```

**Alternative:** If the above doesn't work due to constraints, try this instead:
```sql
-- Delete the old profile and create a new one with correct ID
DELETE FROM profiles WHERE email = 'admin@admin.com';

INSERT INTO profiles (id, full_name, email, role)
SELECT id, 'admin', email, 'admin'
FROM auth.users 
WHERE email = 'admin@admin.com';
```

## Verify it works
After making the change:
1. Log out and log back in
2. Check the browser console - you should see role: "admin"
3. You should be able to access the admin panel

