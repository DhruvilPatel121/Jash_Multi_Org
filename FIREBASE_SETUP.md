# Firebase Setup Guide for Jash Physiotherapy App

This guide will walk you through setting up Firebase for the Jash Physiotherapy Patient Management Application.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `jash-physiotherapy` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional for this project)
6. Click **Create project**
7. Wait for project creation to complete

## Step 2: Register Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. Register app:
   - App nickname: `Jash Physio Web App`
   - Check **"Also set up Firebase Hosting"** (optional)
3. Click **Register app**
4. **IMPORTANT**: Copy the Firebase configuration object - you'll need this later
5. Click **Continue to console**

## Step 3: Enable Authentication

1. In the left sidebar, click **Authentication**
2. Click **Get started**
3. Click on **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on **Email/Password**
   - Toggle **Enable** to ON
   - Click **Save**

### Create Initial Users

1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Create Doctor account:
   - Email: `doctor@jash.com`
   - Password: `doctor123`
   - Click **Add user**
4. Copy the **User UID** (you'll need this for the next step)
5. Repeat for Staff account:
   - Email: `staff@jash.com`
   - Password: `staff123`
   - Copy the **User UID**

## Step 4: Set Up Realtime Database

1. In the left sidebar, click **Realtime Database**
2. Click **Create Database**
3. Select location closest to your users
4. Start in **test mode** (we'll secure it later)
5. Click **Enable**
6. **IMPORTANT**: Copy the database URL (e.g., `https://your-project-default-rtdb.firebaseio.com`)

### Add User Profiles

1. In the Realtime Database view, click the **+** icon next to the database root
2. Add the following structure (replace UIDs with actual UIDs from Step 3):

```json
{
  "users": {
    "DOCTOR_UID_HERE": {
      "uid": "DOCTOR_UID_HERE", //sUEPq54UbCYd7RjrTAC9HT5KgsP2
      "email": "doctor@jash.com",
      "name": "Dr. Jash",
      "role": "doctor",
      "createdAt": 1703001600000
    },
    "STAFF_UID_HERE": {
      "uid": "STAFF_UID_HERE", //qJcOwKgLmmOWnbQwR62VNKfblgG2
      "email": "staff@jash.com",
      "name": "Staff Member",
      "role": "staff",
      "createdAt": 1703001600000
    }
  }
}
```

**How to add this data:**

1. Click the **+** icon next to the database root
2. Name: `users`
3. Click the **+** icon next to `users`
4. Name: Paste the Doctor's UID
5. Click the **+** icon next to the UID
6. Add each field (uid, email, name, role, createdAt) one by one
7. Repeat for Staff user

## Step 5: Configure Security Rules

1. In Realtime Database, click on the **Rules** tab
2. Replace the default rules with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "patients": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["fullName", "phoneNumber", "createdAt"]
    },
    "visits": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["patientId", "visitDate"]
    },
    "doctorObservations": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'doctor' || root.child('users').child(auth.uid).child('role').val() === 'admin')",
      ".indexOn": ["visitId", "patientId"]
    },
    "prescriptions": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["patientId", "visitId"]
    },
    "exercisePlans": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["patientId", "visitId"]
    }
  }
}
```

3. Click **Publish**

## Step 6: Configure Application

1. In your project root, copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_from_step_2
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Where to find these values:**

- Go to Firebase Console → Project Settings (gear icon)
- Scroll down to "Your apps" section
- Click on your web app
- Copy each value from the config object

## Step 7: Test the Application

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm dev
   ```

3. Open your browser to `http://localhost:5173`

4. Login with:

   - Email: `doctor@jash.com`
   - Password: `doctor123`

5. You should see the dashboard!

## Step 8: Add More Users (Optional)

To add more staff members:

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Copy the User UID
5. Go to **Realtime Database**
6. Navigate to `users` node
7. Add a new child with the UID as the key
8. Add the user profile data:
   ```json
   {
     "uid": "NEW_USER_UID",
     "email": "newstaff@jash.com",
     "name": "New Staff Member",
     "role": "staff",
     "createdAt": 1703001600000
   }
   ```

## Troubleshooting

### Issue: "Permission denied" errors

**Solution**:

- Check that security rules are published
- Verify user is logged in
- Check that user profile exists in database

### Issue: User profile not loading

**Solution**:

- Verify the UID in the database matches the UID in Authentication
- Check that all required fields are present (uid, email, name, role, createdAt)
- Check browser console for errors

### Issue: Can't login

**Solution**:

- Verify Email/Password authentication is enabled
- Check that the user exists in Authentication
- Verify credentials are correct
- Check browser console for errors

### Issue: Database connection errors

**Solution**:

- Verify database URL in `.env` file
- Check that Realtime Database is created and enabled
- Verify security rules allow authenticated access

## Production Checklist

Before deploying to production:

- [ ] Update security rules to be more restrictive
- [ ] Enable Firebase App Check for additional security
- [ ] Set up Firebase Hosting or deploy to your preferred platform
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (required for production)
- [ ] Set up monitoring and alerts
- [ ] Create backup strategy for database
- [ ] Document admin procedures
- [ ] Train staff on using the application

## Firebase Free Tier Limits

Your application should stay within free tier limits:

- **Authentication**: Unlimited email/password sign-ins
- **Realtime Database**:
  - 1 GB stored data
  - 10 GB/month downloaded
  - 100 simultaneous connections
- **Hosting**: 10 GB storage, 360 MB/day transfer

For a clinic with 1 doctor and 10 staff members managing ~1000 patients, these limits are more than sufficient.

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Status Dashboard](https://status.firebase.google.com/)
- [Firebase Support](https://firebase.google.com/support)

## Security Best Practices

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use strong passwords** for all accounts
3. **Regularly review security rules**
4. **Monitor authentication logs** for suspicious activity
5. **Keep Firebase SDK updated**
6. **Use HTTPS in production**
7. **Implement proper error handling**
8. **Regular database backups**

---

**Need Help?** Check the main README.md for additional troubleshooting tips and application documentation.
