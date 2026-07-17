# Quick Start Guide

Get the Jash Physiotherapy Patient Management App up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Firebase account (free tier)

## 5-Minute Setup

### 1. Install Dependencies (1 minute)

```bash
pnpm install
```

### 2. Set Up Firebase (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → **Email/Password**
4. Create **Realtime Database** in test mode
5. Copy your Firebase config

### 3. Configure Environment (1 minute)

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Firebase credentials
# (Get these from Firebase Console → Project Settings)
```

### 4. Create Test Users (1 minute)

In Firebase Console → Authentication → Users:

1. Add user: `doctor@jash.com` / `doctor123`
2. Copy the User UID
3. Go to Realtime Database
4. Add under `users/{UID}`:
   ```json
   {
     "uid": "paste_uid_here",
     "email": "doctor@jash.com",
     "name": "Dr. Jash",
     "role": "doctor",
     "createdAt": 1703001600000
   }
   ```

### 5. Start the App (30 seconds)

```bash
pnpm dev
```

Open http://localhost:5173 and login with `doctor@jash.com` / `doctor123`

## First Steps

### Add Your First Patient

1. Click **"Add Patient"** button
2. Fill in:
   - Full Name: John Doe
   - Phone: +1234567890
3. Click **"Save Patient"**

### Record a Visit

1. Click on the patient card
2. Click **"Add Visit"** in the Visits tab
3. Fill in:
   - Chief Complaint: Lower back pain
   - Pain Severity: 7
4. Click **"Save Visit"**

### Add Doctor Observation (Doctor Only)

1. Click on a visit
2. Go to **"Doctor Observation"** tab
3. Click **"Add Observation"**
4. Fill in diagnosis and treatment plan
5. Click **"Save"**

### Create Prescription

1. In a visit detail page
2. Go to **"Prescription"** tab
3. Click **"Add Prescription"**
4. Add medicines with dosage and frequency
5. Click **"Save Prescription"**

### Add Exercise Plan

1. In a visit detail page
2. Go to **"Exercises"** tab
3. Click **"Add Exercise Plan"**
4. Add exercises with sets and reps
5. Click **"Save Exercise Plan"**

## User Roles

### Doctor/Admin
- ✅ Full access to all features
- ✅ Can delete patients
- ✅ Can add doctor observations

### Staff
- ✅ Add/edit patients
- ✅ Record visits
- ✅ Create prescriptions and exercises
- ❌ Cannot delete patients
- ❌ Cannot add doctor observations

## Common Tasks

### Search for a Patient
- Use the search bar on the Patients page
- Search by name, phone, or email

### View Patient History
- Click on a patient card
- See all visits, prescriptions, and exercises in tabs

### Edit Patient Information
- Go to patient detail page
- Click **"Edit"** button
- Update information
- Click **"Update Patient"**

### Add More Staff Members
1. Firebase Console → Authentication → Add user
2. Copy the User UID
3. Realtime Database → Add under `users/{UID}`
4. Set role to "staff"

## Mobile Access

The app is fully responsive and works on:
- 📱 Mobile phones (iOS/Android browsers)
- 💻 Tablets
- 🖥️ Desktop computers

Simply open the URL in any browser!

## Keyboard Shortcuts

- `Tab` - Navigate between form fields
- `Enter` - Submit forms
- `Esc` - Close dialogs

## Tips for Best Experience

1. **Use Chrome or Firefox** for best compatibility
2. **Enable notifications** to stay updated
3. **Bookmark the app** on mobile for quick access
4. **Use search** instead of scrolling through long lists
5. **Add detailed notes** for better patient care tracking

## Troubleshooting

### Can't Login?
- Check email and password
- Verify user exists in Firebase Authentication
- Ensure user profile exists in Realtime Database

### Data Not Showing?
- Check Firebase security rules
- Verify internet connection
- Check browser console for errors

### Permission Denied?
- Verify user role in database
- Check Firebase security rules
- Ensure you're logged in

## Need More Help?

- 📖 Read the full [README.md](./README.md)
- 🔥 Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase setup
- 📊 Check [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) for data schema

## Production Deployment

Ready to go live?

1. Build the app: `pnpm build`
2. Deploy to Firebase Hosting, Vercel, or Netlify
3. Update Firebase security rules for production
4. Set up custom domain (optional)

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
pnpm build
firebase deploy
```

## Support

For issues or questions:
- Check the documentation files
- Review Firebase Console logs
- Check browser console for errors

---

**Ready to manage your patients efficiently!** 🏥✨

Start by adding your first patient and exploring the features.
