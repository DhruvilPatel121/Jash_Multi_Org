# Complete Guide to Set Up a New Firebase Account & Project

This guide will walk you through the entire process of setting up a new Firebase account, creating a new project, and configuring it for the Jash Physiotherapy application.

---

## Prerequisites
- A Google account (to sign up for Firebase)
- Node.js & npm installed on your machine
- The project codebase on your local machine

---

## Step 1: Create a Firebase Account & New Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click **Create a project** (or **Add project** if you already have existing projects)
4. Enter your project name (e.g., "jash-physiotherapy-new")
5. (Optional) Enable Google Analytics (you can skip this if you don't need it)
6. Click **Create project** and wait for Firebase to set it up

---

## Step 2: Set Up Firebase Authentication

1. In the Firebase Console sidebar, go to **Build > Authentication**
2. Click **Get started**
3. Under **Sign-in providers**, enable **Email/Password**:
   - Click **Email/Password**
   - Toggle the **Enable** switch
   - Click **Save**
4. (Optional) You can also enable other providers like Google, Phone, etc., if needed

---

## Step 3: Set Up Realtime Database

1. In the Firebase Console sidebar, go to **Build > Realtime Database**
2. Click **Create Database**
3. Choose **Start in test mode** (we'll update security rules later)
4. Select a location for your database (choose the one closest to your users)
5. Click **Enable**

### Important: Update Security Rules (for Development/Production)
After the database is created, go to the **Rules** tab and set appropriate security rules (refer to your project's existing rules or the DATABASE_STRUCTURE.md file for guidance).

---

## Step 4: Set Up Cloud Storage

1. In the Firebase Console sidebar, go to **Build > Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Click **Next**, then **Done**
5. (Optional) Update security rules in the **Rules** tab for production use

---

## Step 5: Register Your Web App with Firebase

1. In the Firebase Console sidebar, click the **Project Overview** (gear icon) → **Project settings**
2. Scroll down to the **Your apps** section
3. Click the **Add app** button (the web icon, looks like </>)
4. Enter your app's nickname (e.g., "jash-physiotherapy-web")
5. (Optional) Check the box for **Also set up Firebase Hosting**
6. Click **Register app**
7. Copy the Firebase configuration object (you'll need this for the next step!)
8. Click **Continue to console**

---

## Step 6: Configure the Project with New Firebase Credentials

Now you need to connect your local project to the new Firebase project using environment variables.

### 6.1: Create an Environment Variables File
In the root directory of your project, create a file named `.env` (if it doesn't already exist).

### 6.2: Add Your Firebase Credentials
Open the `.env` file and paste the following variables, replacing the placeholder values with the ones you copied from Firebase in Step 5:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Important**: Ensure there are no spaces around the `=` sign.

---

## Step 7: Set Up Firebase Hosting (Optional but Recommended)

If you want to deploy your app to Firebase Hosting:

1. First, make sure you have the Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```
   
2. Log in to Firebase CLI with your Google account:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init
   ```
   - Select **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**
   - Select **Use an existing project**
   - Choose your new Firebase project from the list
   - For "What do you want to use as your public directory?" enter `dist` (this is where our build files go)
   - For "Configure as a single-page app (rewrite all URLs to /index.html)?" select **Yes**
   - For "Set up automatic builds and deploys with GitHub?" you can choose **No** for now
   - For "File dist/index.html already exists. Overwrite?" select **No**

4. Your existing `.firebaserc` and `firebase.json` files should already be set up correctly (we already checked them earlier). You just need to update `.firebaserc` to point to your new project:
   
   Open `.firebaserc` and change the "default" project to your new project's ID:
   ```json
   {
     "projects": {
       "default": "your-new-project-id"
     }
   }
   ```

---

## Step 8: Build and Deploy Your App

1. First, make sure your app builds successfully (we already fixed the build errors!):
   ```bash
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

---

## Step 9: Verify Everything is Working

1. After deployment, Firebase will give you a hosting URL (e.g., `https://your-new-project.web.app`).
2. Open that URL in your browser and test the app to ensure everything works correctly with your new Firebase backend.

---

## Troubleshooting
- If you get errors about missing environment variables, double-check your `.env` file
- If Firebase CLI commands aren't working, ensure you're logged in with `firebase login`
- If database/storage isn't working, check your security rules in the Firebase Console

---

That's it! You've successfully set up a new Firebase account and connected the project to it!
