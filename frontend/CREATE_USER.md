# How to Create Your First User

You don't have any users yet. Here are two ways to create your first user:

## Option 1: Using the API Endpoint (Recommended)

You can create a user by calling the `/api/add` endpoint. You'll need to have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file.

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/add \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### Using JavaScript (in browser console or a script):

```javascript
fetch('http://localhost:3000/api/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123',
    full_name: 'Admin User',
    role: 'admin'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Option 2: Direct SQL in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL (replace with your desired email/password):

```sql
-- First, create the auth user (you'll need to do this via Supabase Auth UI or API)
-- Then insert into users table:

INSERT INTO users (id, email, role, full_name)
VALUES (
  'YOUR_USER_ID_FROM_AUTH',  -- Get this from Supabase Auth after creating user
  'admin@example.com',
  'admin',
  'Admin User'
);
```

## Option 3: Create User via Supabase Auth + SQL

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Auto Confirm User: ✅ (checked)
4. Copy the User ID
5. Go to **SQL Editor** and run:

```sql
INSERT INTO users (id, email, role, full_name)
VALUES (
  'PASTE_USER_ID_HERE',
  'admin@example.com',
  'admin',
  'Admin User'
);
```

## Test Credentials (After Creation)

Once you've created a user, you can login with:

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: `admin` (will redirect to `/admin`)

Or create different roles:
- `role: "teacher"` → redirects to `/teacher`
- `role: "staff"` → redirects to `/dashboard`

## Note

Make sure you have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file for the API endpoint to work.

