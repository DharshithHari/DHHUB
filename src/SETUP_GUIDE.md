# DH Learning - Online Coding Tutoring Platform

## 🎯 Overview
A comprehensive Next.js-based learning management system for online coding tutoring with role-based access control.

## 🔐 Default Admin Credentials
- **Username:** Dharshith24
- **Password:** dharshith@hari24

## 👥 User Roles

### 1. Admin
Full platform control with ability to:
- Create and manage batches (class groups)
- Create teacher and student accounts
- Assign teachers to batches
- Add/remove students from batches
- Create and manage class schedules
- Set Google Meet links for each batch
- Send notifications to everyone or specific groups

### 2. Teacher
Manage their assigned batch with ability to:
- View all students in their batch
- Create assignments with due dates
- Review student project submissions
- Grade assignments and award points
- Send notifications to their batch students
- View upcoming class schedule
- Join classes via integrated Google Meet

### 3. Student
Access their learning materials with ability to:
- View all assignments for their batch
- Submit project links for assignments
- View their scores and total points
- See upcoming class schedule
- Receive notifications from teachers and admin
- Join classes via integrated Google Meet
- Toggle between dark mode and light mode

## 🚀 Getting Started

### First Time Setup (As Admin)

1. **Login as Admin**
   - Use the default credentials above
   - Select "Admin" role on login page

2. **Create Batches**
   - Navigate to "Batches" tab
   - Click "New Batch"
   - Enter batch name (e.g., "Python Beginners Batch")
   - Add Google Meet link
   - Click "Create"

3. **Create Teachers**
   - Navigate to "Users" tab
   - Click "New User"
   - Select "Teacher" role
   - Fill in name, username, and password
   - Click "Create"

4. **Assign Teacher to Batch**
   - Go back to "Batches" tab
   - Click edit icon on a batch
   - Select a teacher from dropdown
   - Click "Save"

5. **Create Students**
   - Navigate to "Users" tab
   - Click "New User"
   - Select "Student" role
   - Fill in name, username, and password
   - Optionally assign to a batch
   - Click "Create"

6. **Add Students to Batch**
   - In "Batches" tab, find your batch
   - Use the "Add student..." dropdown at the bottom
   - Select students to add

7. **Create Class Schedule**
   - Navigate to "Schedules" tab
   - Click "New Schedule"
   - Select batch, enter title, date, and time
   - Click "Create"

## 📚 Features

### Assignment Management
- Teachers create assignments with descriptions and due dates
- Students submit project links
- Teachers review and award points
- Students can see their grades in real-time

### Live Calendar
- Shows upcoming classes for all users
- Automatically filters by user's batch
- Displays date and time for each class

### Notification System
- Admin can notify everyone or just teachers
- Teachers can notify their batch students
- Students can view all notifications
- Real-time updates every 30 seconds

### Google Meet Integration
- Admin sets Meet link for each batch
- Students and teachers can join classes directly in the platform
- Embedded iframe for seamless experience

### Dark Mode (Student Only)
- Toggle button in top-right corner
- Persistent across sessions
- Smooth transitions

## 🎨 UI/UX Features

- **Clean Dashboard Design**: Modern, professional interfaces
- **Color-Coded Roles**: 
  - Admin: Gray/Indigo theme
  - Teacher: Purple theme
  - Student: Blue theme with dark mode option
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Updates**: Schedules and notifications refresh automatically
- **Intuitive Navigation**: Tab-based navigation for easy access

## 📊 Data Management

All data is stored securely in Supabase's key-value store:
- User accounts with role-based access
- Batch information and student assignments
- Assignment submissions and grades
- Class schedules
- Notifications

## 🔒 Security Features

- Password hashing (Base64 encoding for demo purposes)
- Session-based authentication
- Role-based access control
- Protected routes and API endpoints

## 💡 Tips

- **For Admins**: Create batches before adding teachers and students
- **For Teachers**: Check the calendar regularly for upcoming classes
- **For Students**: Submit assignments before due dates to get points
- **Google Meet Links**: Use full Google Meet URLs (https://meet.google.com/...)

## 🛠️ Technical Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS v4.0
- **Backend**: Supabase Edge Functions with Hono
- **Database**: Supabase KV Store
- **Icons**: Lucide React

## 📱 Support

For any issues or questions:
1. Check that users are assigned to correct batches
2. Verify Google Meet links are properly formatted
3. Ensure teachers are assigned to batches before they can create assignments
4. Students must be in a batch to see assignments and join classes

---

**Note**: This is a prototype/demo platform. For production use, implement proper password hashing, email verification, and additional security measures.
