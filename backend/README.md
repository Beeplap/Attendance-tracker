# Attendance Tracking - Backend

This is the backend API part of the Attendance Tracking application built with Next.js API routes.

## Structure

- `api/` - Next.js API routes
  - `add/route.js` - User creation API endpoint
- `package.json` - Backend-specific dependencies
- `next.config.mjs` - Backend-specific Next.js configuration

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /api/add
Creates a new user in the system.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "teacher"
}
```

**Response:**
- Success: `200` with user data
- Error: `400` with error message

## Features

- User management API
- Supabase integration with service role
- Admin user creation functionality
- Profile management
