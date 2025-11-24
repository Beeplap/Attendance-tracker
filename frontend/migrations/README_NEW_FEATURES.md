# New Features Implementation

This document describes the new features added to the attendance tracking system.

## Features Added

### 1. Password Change for Teachers
- **Location**: Teacher Dashboard
- **Component**: `frontend/components/ui/changePassword.jsx`
- **API Route**: `frontend/app/api/change-password/route.js`
- **Functionality**: Teachers can change their password from their dashboard
- **Features**:
  - Current password verification
  - New password validation (minimum 6 characters)
  - Password confirmation
  - Show/hide password toggle

### 2. Leave Request System
- **Location**: Teacher Dashboard & Admin Panel
- **Components**: 
  - `frontend/components/ui/leaveRequest.jsx` (Teacher form)
  - Admin view in `frontend/app/admin/page.js`
- **API Route**: `frontend/app/api/leave-requests/route.js`
- **Database Table**: `leave_requests`
- **Functionality**:
  - Teachers can submit leave requests with start date, end date, and reason
  - Admins can view all leave requests
  - Admins can approve or reject leave requests
  - Admins can add notes when approving/rejecting

### 3. Class Switch System
- **Location**: Teacher Dashboard & Admin Panel
- **Components**:
  - `frontend/components/ui/classSwitch.jsx` (Teacher form)
  - Admin view in `frontend/app/admin/page.js`
- **API Route**: `frontend/app/api/class-switches/route.js`
- **Database Table**: `class_switches`
- **Functionality**:
  - Teachers can request to switch classes with another teacher
  - Target teacher must accept the switch request
  - Both teachers can see pending switch requests
  - Admin is automatically notified when a switch is completed
  - Admin can view all switch requests and their status

## Database Migrations Required

Before using these features, you need to run the following SQL migrations in your Supabase SQL Editor:

### 1. Leave Requests Table
Run: `frontend/migrations/create_leave_requests_table.sql`

This creates:
- `leave_requests` table with columns:
  - `id` (UUID, Primary Key)
  - `teacher_id` (UUID, Foreign Key to users)
  - `start_date` (DATE)
  - `end_date` (DATE)
  - `reason` (TEXT)
  - `status` (VARCHAR) - 'pending', 'approved', 'rejected'
  - `admin_id` (UUID, Foreign Key to users)
  - `admin_notes` (TEXT)
  - `created_at`, `updated_at` (TIMESTAMP)

### 2. Class Switches Table
Run: `frontend/migrations/create_class_switches_table.sql`

This creates:
- `class_switches` table with columns:
  - `id` (UUID, Primary Key)
  - `requester_teacher_id` (UUID, Foreign Key to users)
  - `requester_class_id` (UUID, Foreign Key to classes)
  - `target_teacher_id` (UUID, Foreign Key to users)
  - `target_class_id` (UUID, Foreign Key to classes)
  - `switch_date` (DATE)
  - `reason` (TEXT, optional)
  - `status` (VARCHAR) - 'pending', 'accepted', 'rejected', 'completed'
  - `target_teacher_accepted` (BOOLEAN)
  - `admin_notified` (BOOLEAN)
  - `created_at`, `updated_at` (TIMESTAMP)

## How to Use

### For Teachers:

1. **Change Password**:
   - Click "Change Password" button in the header
   - Enter current password, new password, and confirm
   - Click "Change Password"

2. **Request Leave**:
   - Click "Request Leave" button in the header
   - Select start date and end date
   - Enter reason for leave
   - Submit request
   - View status in your dashboard

3. **Switch Classes**:
   - Click "Switch Class" button in the header
   - Select your class to switch
   - Select target teacher
   - Select their class
   - Choose switch date
   - Optionally add a reason
   - Send request
   - Wait for target teacher to accept

4. **Accept/Reject Switch Requests**:
   - Pending switch requests appear at the top of your dashboard
   - Click "Accept" or "Reject" for each request

### For Admins:

1. **View Leave Requests**:
   - Navigate to "Leave Requests" in the sidebar
   - View all leave requests with their status
   - Click "Approve" or "Reject" for pending requests
   - Add optional notes when approving/rejecting

2. **View Class Switches**:
   - Navigate to "Class Switches" in the sidebar
   - View all switch requests and their status
   - See completed switches (admin is automatically notified)

## Security Features

- Row Level Security (RLS) is enabled on both tables
- Teachers can only view their own leave requests and switches they're involved in
- Admins can view all requests
- Password changes require current password verification
- All actions are logged with timestamps

## Notifications

- When a class switch is completed, admins automatically receive a notification
- Notifications appear in the notification bell in the admin panel

## Notes

- All date validations prevent past dates
- Switch requests cannot be duplicated for the same classes on the same date
- Leave requests show pending status until admin action
- Class switches require both teacher acceptance before completion

