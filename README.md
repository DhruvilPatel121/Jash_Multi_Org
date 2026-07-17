# Welcome to Your Dhruvil's Live Project

Dhruvil's Application Link
URL : https://jash-physiotherapy-5a2e1.web.app

# Jash Physiotherapy Patient Management App

A comprehensive web-based patient management system for physiotherapy clinics, built with React, TypeScript, and Firebase.

## Features

- **User Authentication**: Role-based access control (Doctor, Staff, Admin)
- **Patient Management**: Complete CRUD operations for patient records
- **Visit History**: Track patient visits with detailed information
- **Doctor Observations**: Doctor-only section for examination findings and diagnosis
- **Prescription Management**: Create and manage prescriptions with multiple medicines
- **Exercise Plans**: Assign physiotherapy exercises to patients
- **Real-time Sync**: Multi-user synchronization using Firebase Realtime Database
- **Search & Filter**: Quick search by patient name, phone, or email
- **Dashboard**: Overview of key metrics and quick actions
- **Mobile-Responsive**: Optimized for both desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Authentication, Realtime Database, Storage)
- **Build Tool**: Vite
- **Routing**: React Router v7

## Prerequisites

- Node.js 18+ and pnpm
- Firebase account (free tier)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on the web icon (</>) to add a web app
4. Register your app and copy the Firebase configuration

### 2. Enable Firebase Services

#### Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication
3. Create initial users:
   - Doctor: `doctor@jash.com` / `doctor123`
   - Staff: `staff@jash.com` / `staff123`

#### Realtime Database

1. Go to **Realtime Database** → **Create Database**
2. Start in **test mode** (we'll add security rules later)
3. Note the database URL (e.g., `https://your-project.firebaseio.com`)

#### Security Rules

After testing, update your Realtime Database rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "patients": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "visits": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "doctorObservations": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'doctor' || root.child('users').child(auth.uid).child('role').val() === 'admin')"
    },
    "prescriptions": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "exercisePlans": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace the values with your Firebase project configuration.

## Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint
```

## Initial Setup

### Create User Profiles in Firebase

After creating authentication users, you need to add their profiles to the Realtime Database:

1. Go to Firebase Console → Realtime Database
2. Add user profiles manually under the `users` node:

```json
{
  "users": {
    "user_uid_from_auth": {
      "uid": "user_uid_from_auth",
      "email": "doctor@jash.com",
      "name": "Dr. Jash",
      "role": "doctor",
      "createdAt": 1703001600000
    },
    "another_user_uid": {
      "uid": "another_user_uid",
      "email": "staff@jash.com",
      "name": "Staff Member",
      "role": "staff",
      "createdAt": 1703001600000
    }
  }
}
```

**Note**: The `uid` in the database must match the `uid` from Firebase Authentication.

## User Roles

### Doctor / Admin

- Full access to all features
- Can add/edit/delete patients
- Can add doctor observations
- Can create prescriptions and exercise plans
- Can delete patient records

### Staff

- Can add new patients
- Can add visit history
- Can create prescriptions and exercise plans
- Limited edit permissions
- Cannot delete patients
- Cannot add doctor observations

## Application Structure

```
src/
├── components/
│   ├── common/          # Shared components (Header, RouteGuard)
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts (AuthContext)
├── hooks/               # Custom hooks
├── lib/                 # Utilities and Firebase config
├── pages/               # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── PatientsPage.tsx
│   ├── PatientFormPage.tsx
│   ├── PatientDetailPage.tsx
│   ├── VisitFormPage.tsx
│   └── VisitDetailPage.tsx
├── services/            # Firebase service layer
├── types/               # TypeScript type definitions
├── App.tsx              # Main app component
└── routes.tsx           # Route configuration
```

## Key Features Explained

### Patient Registration

- Required fields: Full Name, Phone Number
- Optional fields: Email, Address, Age, DOB, Gender, Emergency Contact, Medical History, Current Medications
- Tracks who created the record and when

### Visit History

- Record visit date, chief complaint, pain severity (1-10 scale)
- Track duration of problem and previous treatments
- Add visit notes
- Links to patient record

### Doctor Observations

- **Doctor-only feature**
- Examination findings
- Diagnosis
- Treatment plan
- Estimated recovery time
- Warnings and precautions
- Doctor notes

### Prescriptions

- Add multiple medicines per prescription
- Each medicine includes: name, dosage, frequency, duration, instructions
- Linked to specific visit

### Exercise Plans

- Add multiple exercises per plan
- Each exercise includes: name, repetitions, sets, frequency, duration
- Linked to specific visit

### Real-time Synchronization

- Changes are instantly visible to all logged-in users
- Uses Firebase Realtime Database listeners
- Automatic updates without page refresh

## Mobile Responsiveness

The application is fully responsive and optimized for:

- Desktop (1920x1080, 1366x768, 1440x900)
- Laptop (1280x720, 1536x864)
- Mobile (375x667, 414x896, 430x932)

Mobile features:

- Hamburger menu navigation
- Touch-optimized UI
- Responsive forms and cards
- Optimized layouts for small screens

## Firebase Free Tier Limits

The application is designed to work within Firebase free tier:

- **Authentication**: 10,000 phone authentications/month (unlimited email)
- **Realtime Database**: 1 GB storage, 10 GB/month download
- **Storage**: 5 GB storage, 1 GB/day download

For a clinic with 1 doctor and 10 staff members, these limits are sufficient for production use.

## Security Considerations

1. **Authentication**: All routes except login require authentication
2. **Role-based Access**: Doctor observations restricted to doctor/admin roles
3. **Firebase Rules**: Implement proper security rules in production
4. **Environment Variables**: Never commit `.env` file to version control
5. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### "Permission Denied" errors

- Check Firebase security rules
- Ensure user is authenticated
- Verify user role in database

### User profile not loading

- Ensure user profile exists in Realtime Database under `users/{uid}`
- Check that `uid` matches Firebase Authentication uid

### Real-time updates not working

- Check Firebase Realtime Database connection
- Verify database URL in environment variables
- Check browser console for errors

## Development Tips

1. **Testing**: Use Firebase Emulator Suite for local development
2. **Data Structure**: Keep data denormalized for better read performance
3. **Indexes**: Add indexes for frequently queried fields
4. **Offline Support**: Firebase SDK includes offline persistence by default

## Production Deployment

1. Build the application: `pnpm build`
2. Deploy to hosting service (Firebase Hosting, Vercel, Netlify, etc.)
3. Update Firebase security rules for production
4. Set up proper environment variables
5. Enable HTTPS
6. Configure custom domain (optional)

## Support

For issues or questions:

1. Check Firebase Console for errors
2. Review browser console logs
3. Verify environment configuration
4. Check Firebase security rules

## License

Copyright © 2025 Dhruvil Patel

---

**Note**: This is a web application. It works on mobile browsers and can be installed for a Android & iOS devices.
