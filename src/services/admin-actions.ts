import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { createUser } from "./firebase"; // The existing function to write to RTDB

// This is the primary config from your existing firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL!,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: import.meta.env.VITE_FIREBASE_APP_ID!,
};

// Initialize a secondary Firebase app for admin actions
// This prevents the main app's auth state from being affected
const adminApp = getApps().find(app => app.name === 'admin-actions') || initializeApp(firebaseConfig, 'admin-actions');
const adminAuth = getAuth(adminApp);

/**
 * Registers a new doctor by an admin.
 * Creates user in Firebase Auth and a corresponding user record in Realtime Database.
 * Does NOT log the admin out.
 * @param organizationId The organization ID to associate the doctor with.
 * @param name The doctor's full name.
 * @param email The doctor's email.
 * @param password The doctor's login password.
 */
export const registerDoctorByAdmin = async (organizationId: string, name: string, email: string, password: string) => {
  try {
    // 1. Create the user in the secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(
      adminAuth,
      email,
      password
    );
    const { uid } = userCredential.user;

    // 2. Create the user record in the Realtime Database using the primary connection
    const newUser = {
      uid,
      email,
      name,
      role: 'doctor' as const, // Always assign 'doctor' role
      organizationId, // Associate with the organization
      createdAt: Date.now(),
    };
    await createUser(uid, newUser);

    return { error: null };

  } catch (error: any) {
    // Provide a more user-friendly error message
    let message = "An unexpected error occurred.";
    if (error.code === 'auth/email-already-in-use') {
      message = "This email address is already registered.";
    } else if (error.code === 'auth/weak-password') {
      message = "The password is too weak. It must be at least 6 characters long.";
    }
    console.error("Admin doctor registration failed:", error);
    return { error: new Error(message) };
  }
};
