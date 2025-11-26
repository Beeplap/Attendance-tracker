# Student Management System

A modern student management and attendance tracking application with separate frontend and backend components.

## Project Structure

This project has been reorganized into two main directories:

### 📁 Frontend (`/frontend`)
Contains all client-side code:
- **React Components**: UI components, pages, and layouts
- **Styling**: Tailwind CSS configuration and global styles
- **Client Logic**: Supabase client configuration and utility functions
- **Configuration**: Frontend-specific Next.js and build configurations

### 📁 Backend (`/backend`)
Contains all server-side code:
- **API Routes**: Next.js API endpoints for user management
- **Server Logic**: Backend business logic and database operations
- **Configuration**: Backend-specific Next.js configuration

## Quick Start

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Features

- 🔐 User authentication and authorization
- 👥 Role-based access control (Admin, Teacher, User)
- 📊 Admin dashboard for user management
- 👨‍🏫 Teacher dashboard for attendance tracking
- 📱 Responsive design
- 🎨 Modern UI with dark mode support

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Development

Each part can be developed and deployed independently:

- **Frontend**: Deploy as a static site or Next.js application
- **Backend**: Deploy as a serverless API or Next.js server

## Contributing

1. Make changes in the appropriate directory (`frontend/` or `backend/`)
2. Test your changes locally
3. Update documentation if needed
4. Submit a pull request

## License

This project is private and proprietary.