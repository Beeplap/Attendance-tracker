# Student Management System

A modern Student Management System web application built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase project (create one at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### How to Get Your Supabase Credentials:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server (after building)
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library code (Supabase client, helpers)
│   ├── styles/          # Global styles (Tailwind CSS)
│   └── utils/           # Utility functions
├── next.config.js       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Supabase Setup

### Creating Tables

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Create your tables (e.g., `students`, `courses`, `enrollments`, etc.)
4. Update the TypeScript types in `src/lib/supabase.ts` to match your schema

### Using Typed Helpers

The project includes typed helper functions in `src/lib/supabase-helpers.ts` for common database operations. Update the `Database` type in `src/lib/supabase.ts` to match your Supabase schema for full type safety.

## Next Steps

- Set up authentication pages (login, signup)
- Create your database schema in Supabase
- Build out your components and pages
- Implement form validation with React Hook Form + Zod

## License

MIT
