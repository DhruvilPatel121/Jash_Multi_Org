# Jash Physiotherapy Patient Management App Requirements Document

## 1. Application Overview

### 1.1 Application Name
Jash Physiotherapy Patient Management App

### 1.2 Application Description
A complete Android-first mobile application for physiotherapy and medical clinic patient management. The app enables doctors and staff members to manage patient records, visit history, prescriptions, and physiotherapy exercise plans with real-time synchronization across multiple users.

### 1.3 Application Purpose
Provide a simple, fast, and low-cost patient management solution that operates entirely on free-tier services, suitable for use by one doctor and up to 10 staff members in a production environment.

## 2. Technical Stack
\n### 2.1 Frontend
- React Native (Expo)
- TypeScript
- Tailwind CSS (NativeWind)
- React Navigation

### 2.2 Backend & Database
- Firebase Authentication
- Firebase Realtime Database
- Firebase Storage (free tier only)
- All services must operate within Firebase FREE TIER limits

## 3. User Roles & Permissions

### 3.1 Doctor Role
- Full access (read/write/edit/delete)
- View all patients, visits, prescriptions, and exercises
- Add doctor notes and diagnosis
- Admin-level privileges\n
### 3.2 Staff Role (Physiotherapist / Reception)
- Add new patients
- Add visit history\n- Limited edit permissions
- Cannot delete patients
\n### 3.3 Admin Role\n- Create and manage staff accounts (10+ users)\n- Doctor-level access\n\n### 3.4 Authentication Requirements
- Unique login for each staff member (email + password)
- Role stored in database
- Access restrictions enforced via Firebase Security Rules
- Auto-login after refresh
\n## 4. Core Features\n
### 4.1 Authentication System
- Firebase Authentication integration
- Login and logout functionality
- Role-based access control
- Automatic session persistence

### 4.2 Patient Registration
**Required Fields:**
- Full Name (required)
- Phone Number (required)
\n**Optional Fields:**
- Email\n- Address
- Age / Date of Birth
- Gender\n- Emergency Contact
- Medical History
- Current Medications\n\n**System Fields:**
- Created by (staff ID)
- Created date

**Operations:** Full CRUD (Create, Read, Update, Delete)\n
### 4.3 Patient Visit History
**Visit Information:**
- Visit date and time
- Chief complaint / injury description
- Duration of problem
- Previous treatment history
- Pain severity scale (1-10)
- Attending staff member
- Visit notes

**Functionality:** Multiple visits per patient with complete history tracking

### 4.4 Doctor Observations
**Observation Fields:**
- Examination findings
- Diagnosis
- Treatment plan
- Estimated recovery time
- Warnings and precautions
- Doctor notes

**Access Control:** Only Doctor role can edit this section

### 4.5 Prescription Management
**Prescription Details:**
- Medicine name
- Dosage
- Frequency
- Duration (days)\n- Instructions (with/without food, timing)

**Linking:** Connected to specific patient and visit records

### 4.6 Exercise / Physiotherapy Plan
**Exercise Information:**
- Exercise name
- Repetitions and sets
- Frequency (daily/weekly)
- Duration (days)\n
**Linking:** Connected to specific patient and visit records

### 4.7 Search & Filter
**Search Capabilities:**
- Search by patient name
- Search by phone number
- Filter by visit date
- Filter by complaint/injury type
- Auto-suggestion during typing

### 4.8 Dashboard
**Dashboard Metrics:**
- Total number of patients
- Today's visits count
- Follow-ups due\n- Pending prescriptions

### 4.9 Multi-Staff Synchronization
- Real-time data sync using Firebase Realtime Database
- Instant visibility of changes across all logged-in users
- Activity tracking (who created/edited data)
\n## 5. Database Structure

### 5.1 Users Collection
```\nusers/
  userId/
    name: string
    role: string (doctor/staff/admin)
    email: string
```

### 5.2 Patients Collection
```
patients/
  patientId/
    personalDetails: object
    createdBy: userId
    createdAt: timestamp
```

### 5.3 Visits Collection
```
visits/
  visitId/
    patientId: string
    visitData: object
    createdAt: timestamp
```
\n### 5.4 Prescriptions Collection
```
prescriptions/
  prescriptionId/
    patientId: string
    visitId: string
    medicines: array\n```

### 5.5 Exercises Collection
```
exercises/
  exerciseId/
    patientId: string
    visitId: string
    exercises: array
```

## 6. Design Style

### 6.1 Visual Approach
- Clean medical interface optimized for mobile devices
- Minimalist design with focus on functionality
\n### 6.2 Color Scheme
- Primary: White background\n- Accent: Light blue for interactive elements
- Success: Green for confirmations and positive actions

### 6.3 Typography
- Large, readable text suitable for quick scanning
- Clear hierarchy for medical information
\n### 6.4 UI Elements
- Simple form layouts for non-technical staff
- Icon integration for improved navigation
- Card-based layout for patient records

## 7. Technical Constraints

### 7.1 Service Limitations
- Must operate within Firebase FREE TIER limits
- No paid external APIs
- No Play Store publishing required
- Lightweight application architecture

### 7.2 Code Requirements
- Clean, maintainable code structure
- TypeScript for type safety
- Comprehensive Firebase Security Rules
\n## 8. Deliverables

### 8.1 Application Components
- Complete frontend code (React Native + TypeScript)
- Firebase configuration files
- Database security rules
- Authentication flow implementation
- Working CRUD operations for all modules

### 8.2 Documentation
- README with setup instructions
- Sample test data
- Firebase configuration guide
\n### 8.3 Deployment\n- Ready-to-run application via `npm start` or `expo start`
- Development environment setup instructions