# Student API Endpoints - cURL Examples

This document provides cURL examples for testing all student CRUD endpoints.

**Base URL**: `http://localhost:3000`

---

## 1. Create Student (POST /api/students)

### Request
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "roll": "STU001",
    "full_name": "John Doe",
    "dob": "2010-05-15",
    "gender": "Male",
    "class": "Grade 10",
    "section": "A",
    "guardian_name": "Jane Doe",
    "guardian_contact": "+1234567890",
    "address": "123 Main St, City",
    "admission_date": "2024-01-15"
  }'
```

### Expected Response (201 Created)
```json
{
  "ok": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "roll": "STU001",
    "full_name": "John Doe",
    "dob": "2010-05-15",
    "gender": "Male",
    "class": "Grade 10",
    "section": "A",
    "guardian_name": "Jane Doe",
    "guardian_contact": "+1234567890",
    "address": "123 Main St, City",
    "profile_url": null,
    "admission_date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response (400 Bad Request - Validation Error)
```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["full_name"],
      "message": "Full name is required"
    }
  ]
}
```

---

## 2. List Students (GET /api/students)

### Get All Students
```bash
curl http://localhost:3000/api/students
```

### Filter by Class
```bash
curl "http://localhost:3000/api/students?class=Grade%2010"
```

### Filter by Class and Section
```bash
curl "http://localhost:3000/api/students?class=Grade%2010&section=A"
```

### Search Students
```bash
curl "http://localhost:3000/api/students?search=John"
```

### Combined Filters
```bash
curl "http://localhost:3000/api/students?class=Grade%2010&section=A&search=Doe"
```

### Expected Response (200 OK)
```json
{
  "ok": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "roll": "STU001",
      "full_name": "John Doe",
      "dob": "2010-05-15",
      "gender": "Male",
      "class": "Grade 10",
      "section": "A",
      "guardian_name": "Jane Doe",
      "guardian_contact": "+1234567890",
      "address": "123 Main St, City",
      "profile_url": null,
      "admission_date": "2024-01-15",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "roll": "STU002",
      "full_name": "Jane Smith",
      "dob": "2010-06-20",
      "gender": "Female",
      "class": "Grade 10",
      "section": "A",
      "guardian_name": "John Smith",
      "guardian_contact": "+1234567891",
      "address": "456 Oak Ave, City",
      "profile_url": null,
      "admission_date": "2024-01-15",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### Empty Result Response
```json
{
  "ok": true,
  "data": []
}
```

---

## 3. Get Student by ID (GET /api/students/[id])

### Request
```bash
curl http://localhost:3000/api/students/123e4567-e89b-12d3-a456-426614174000
```

### Expected Response (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "roll": "STU001",
    "full_name": "John Doe",
    "dob": "2010-05-15",
    "gender": "Male",
    "class": "Grade 10",
    "section": "A",
    "guardian_name": "Jane Doe",
    "guardian_contact": "+1234567890",
    "address": "123 Main St, City",
    "profile_url": null,
    "admission_date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "ok": false,
  "error": "Student not found"
}
```

---

## 4. Update Student (PUT /api/students/[id])

### Request
```bash
curl -X PUT http://localhost:3000/api/students/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Smith",
    "class": "Grade 11",
    "guardian_contact": "+1234567899"
  }'
```

### Expected Response (200 OK)
```json
{
  "ok": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "roll": "STU001",
    "full_name": "John Smith",
    "dob": "2010-05-15",
    "gender": "Male",
    "class": "Grade 11",
    "section": "A",
    "guardian_name": "Jane Doe",
    "guardian_contact": "+1234567899",
    "address": "123 Main St, City",
    "profile_url": null,
    "admission_date": "2024-01-15",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "ok": false,
  "error": "Student not found"
}
```

### Error Response (400 Bad Request - Validation Error)
```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["roll"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

---

## 5. Delete Student (DELETE /api/students/[id])

### Request
```bash
curl -X DELETE http://localhost:3000/api/students/123e4567-e89b-12d3-a456-426614174000
```

### Expected Response (200 OK)
```json
{
  "ok": true,
  "data": {
    "message": "Student deleted successfully"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "ok": false,
  "error": "Student not found"
}
```

---

## Error Response Format

All endpoints follow a consistent error response format:

### 400 Bad Request (Validation Error)
```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["field_name"],
      "message": "Error message"
    }
  ]
}
```

### 404 Not Found
```json
{
  "ok": false,
  "error": "Student not found"
}
```

### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Failed to [operation] student"
}
```

---

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD)
- The `id` field is auto-generated (UUID) and should not be included in POST requests
- The `created_at` field is auto-generated and cannot be updated
- All optional fields can be omitted or set to `null`
- The `profile_url` field must be a valid URL if provided
- Search is case-insensitive and searches in: full_name, roll, and guardian_name

