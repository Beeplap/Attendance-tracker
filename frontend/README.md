# Attendance Tracking - Frontend

This is the frontend part of the Attendance Tracking application built with Next.js and React.

## Structure

- `app/` - Next.js App Router pages and layouts
  - `page.js` - Login page
  - `layout.js` - Root layout
  - `globals.css` - Global styles
  - `admin/page.js` - Admin dashboard
  - `dashboard/page.js` - Teacher dashboard
- `components/` - Reusable React components
  - `ui/` - UI components (Button, Card, etc.)
- `lib/` - Utility functions and client-side logic
  - `supabaseClient.js` - Supabase client configuration
  - `utils.js` - Utility functions

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Features

- User authentication with Supabase
- Role-based access control (Admin, Teacher, User)
- Responsive design with Tailwind CSS
- Modern UI components with Radix UI
