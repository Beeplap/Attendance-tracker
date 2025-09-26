## Attendance Tracking – Next.js + Supabase

Production-ready starter for an online attendance tracker with email/password login via Supabase and role-based routing (admin vs teacher).

### Features
- Supabase email/password authentication
- Role-based redirects using admin email list
- Pages: `Login /` → `Dashboard /dashboard` (teacher) → `Admin /admin`
- Tailwind CSS (v4) with `@tailwindcss/postcss` and `tw-animate-css`

### Tech Stack
- Next.js 15 (App Router, Turbopack)
- React 19
- Supabase JS v2
- Tailwind CSS v4

### Dependencies
Runtime:
- `next`
- `react`, `react-dom`
- `@supabase/supabase-js`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `tailwind-merge`

Dev:
- `eslint`, `eslint-config-next`, `@eslint/eslintrc`
- `@tailwindcss/postcss`
- `tailwindcss`
- `tw-animate-css`

### Prerequisites
- Node.js 18+ (recommended LTS)
- A Supabase project (free tier is fine)

### 1) Clone & Install
```bash
git clone https://github.com/Beeplap/Attendance-tracker attendance-tracking
cd attendance-tracking
npm install
```

### 2) Configure Environment Variables
Create a `.env.local` file in the project root and paste your Supabase credentials from Supabase → Settings → API.
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Comma-separated admin emails for the Admin panel
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Notes:
- Use the anon public key (not service role). Do not wrap values in quotes.
- Restart the dev server after editing `.env.local`.

### 3) Supabase Auth Settings
In Supabase Studio:
- Authentication → Providers → Email: enable Email/Password
- For local dev without SMTP, disable "Confirm email" or allow unconfirmed sign-in
- Authentication → URL Configuration → Site URL: `http://localhost:3000`

### 4) Seed Test Users
In Supabase → Authentication → Users → Add user:
- Create a teacher user (email not in `NEXT_PUBLIC_ADMIN_EMAILS`)
- Create an admin user (email listed in `NEXT_PUBLIC_ADMIN_EMAILS`)

### 5) Run the App
```bash
npm run dev
# open http://localhost:3000
```

### Scripts
```bash
npm run dev     # start dev server (Turbopack)
npm run build   # production build
npm run start   # run production server
npm run lint    # run eslint
```

### Project Structure (key parts)
```bash
app/
  layout.js          # imports global styles
  page.js            # login page (Supabase email/password)
  admin/page.js      # admin panel (guards/redirects)
  dashboard/page.js  # teacher dashboard (guards/redirects)
components/
  ui/button.jsx      # Button component (shadcn-style)
lib/
  supabaseClient.js  # Supabase browser client singleton
  utils.js
```

### Authentication Flow
- `app/page.js` signs in with `supabase.auth.signInWithPassword`.
- After auth, the email is checked against `NEXT_PUBLIC_ADMIN_EMAILS`:
  - In list → redirect to `/admin`
  - Not in list → redirect to `/dashboard`
- Visiting `/admin` or `/dashboard` directly runs the same guard logic.

### Troubleshooting
Invalid API Key on sign-in:
```bash
# Check your .env.local values
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co   # no trailing slash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...                   # anon key, exact copy

# Restart the dev server after changes
```
Quick connectivity check in browser console:
```javascript
const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  .then(r => console.log('status', r.status))
  .catch(console.error);
```
Expect `status 200` if URL/key are valid.

Multiple Supabase client warning:
- We use a singleton in `lib/supabaseClient.js` with a custom `storageKey` to avoid duplicates.

### License
MIT


