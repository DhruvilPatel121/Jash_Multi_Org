# New Multi-Organization Project Setup Guide

## Overview
This guide explains how to create a NEW project with multi-organization support from scratch, while keeping the existing project unchanged for the current client.

## Architecture Decision

### Why Create New Project?
- **Zero risk** to existing live system
- **No migration** needed - clean slate
- **No backward compatibility** required
- **Proper architecture** from day one
- **Independent systems** - can run simultaneously

### Project Structure
```
Existing Project (jash_app)          New Project (jash_app_multi_org)
├── src/                            ├── src/
│   ├── components/                 │   ├── components/ (SAME - copy as-is)
│   ├── contexts/                   │   ├── contexts/ (MODIFIED - AuthContext)
│   ├── lib/                        │   ├── lib/ (SAME - copy as-is)
│   ├── pages/                      │   ├── pages/ (MODIFIED - add org selection)
│   ├── services/                   │   ├── services/ (MODIFIED - org-aware)
│   ├── types/                      │   ├── types/ (MODIFIED - add org types)
│   └── hooks/                      │   ├── hooks/ (SAME - copy as-is)
├── public/                         ├── public/ (SAME - copy as-is)
├── index.html                      ├── index.html (SAME - copy as-is)
├── package.json                    ├── package.json (SAME - copy as-is)
├── vite.config.ts                  ├── vite.config.ts (SAME - copy as-is)
└── .env                            └── .env (NEW - new Firebase config)
```

## Step 1: Create New Project

### 1.1 Copy Existing Project
```bash
# Navigate to parent directory
cd "f:\Client\Jash Physio"

# Copy the existing project
cp -r jash_app jash_app_multi_org

# Navigate to new project
cd jash_app_multi_org
```

### 1.2 Update Project Configuration
```bash
# Update package.json name
# Change "name": "jash_app" to "name": "jash_app_multi_org"
```

## Step 2: Firebase Setup

### 2.1 Create New Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `jash-physio-multi-org`
4. Enable Google Analytics (optional)
5. Create project

### 2.2 Enable Firebase Services
1. **Authentication**
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Disable other providers (unless needed)

2. **Realtime Database**
   - Go to Realtime Database → Create Database
   - Select location (same as existing project)
   - Start in test mode (will update rules later)
   - Choose or start in test mode

3. **Storage** (if needed for images)
   - Go to Storage → Get Started
   - Select location
   - Set rules for test mode

### 2.3 Get Firebase Configuration
1. Go to Project Settings → General
2. Scroll to "Your apps" → Web app
3. Register app: `jash-physio-multi-org`
4. Copy Firebase config

### 2.4 Create Environment Variables
Create `.env` file in new project:
```env
VITE_FIREBASE_API_KEY=your_new_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_new_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_new_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_new_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_new_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 3: Type Definitions (MODIFIED)

### File: `src/types/index.ts`

**Add new types:**
```typescript
// Add after UserRole definition
export type UserRole = 'doctor' | 'staff' | 'admin';

// NEW: Organization types
export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: 'free' | 'basic' | 'premium';
  maxUsers?: number;
  maxPatients?: number;
  isActive: boolean;
  createdAt: number;
  createdBy: string;
  createdByName: string;
  updatedAt?: number;
  updatedBy?: string;
  updatedByName?: string;
}

export interface OrganizationSettings {
  theme?: {
    primaryColor?: string;
    logoUrl?: string;
  };
  features?: {
    enablePrescriptions?: boolean;
    enableExercisePlans?: boolean;
    enableReports?: boolean;
  };
  businessHours?: {
    start?: string;
    end?: string;
    days?: string[];
  };
}

// MODIFIED: User type with organizationId
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string; // NEW - required field
  organizationName?: string; // NEW - for display
  createdAt: number;
  sessionId?: string;
  isActive?: boolean; // NEW - for admin to deactivate users
}

// MODIFIED: Patient type with organizationId
export interface Patient {
  id: string;
  organizationId: string; // NEW - required field
  fullName: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
  medicalHistory?: string;
  currentMedications?: string;
  complaint?: string;
  investigation?: string;
  diagnosis?: string;
  precautions?: string;
  paymentDetails?: string;
  attendancePaymentDetails?: string;
  treatmentPlan?: {
    electroTherapy?: string[];
    exerciseTherapy?: string[];
  };
  attendance?: Record<string, 'present' | 'absent' | 'consulting'>;
  paidDays?: number;
  paymentHistory?: Array<{
    days: number;
    timestamp: number;
    notes?: string;
    completedDates?: string[];
  }>;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: number;
}

// MODIFIED: CaseNote type with organizationId
export interface CaseNote {
  id: string;
  organizationId: string; // NEW - required field
  patientId: string;
  patientName: string;
  date: number;
  complaint?: string;
  diagnosis?: string;
  mriFinding?: string;
  xrayFinding?: string;
  precautions?: string;
  rxPlan?: string;
  exerciseProtocol?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: number;
}
```

## Step 4: Firebase Services (MODIFIED)

### File: `src/services/firebase.ts`

**Add organization-aware path helper:**
```typescript
// Add at the top of the file
export const getOrgPath = (organizationId: string, path: string) => {
  return `organizations/${organizationId}/${path}`;
};
```

**Modify all functions to use organizationId:**

```typescript
// Organization operations (NEW)
export const createOrganization = async (orgData: Omit<Organization, 'id'>) => {
  const orgsRef = ref(database, 'organizations');
  const newOrgRef = push(orgsRef);
  const orgId = newOrgRef.key!;
  await set(newOrgRef, { id: orgId, ...orgData });
  return orgId;
};

export const getOrganization = async (orgId: string): Promise<Organization | null> => {
  const orgRef = ref(database, `organizations/${orgId}`);
  const snapshot = await get(orgRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllOrganizations = async (): Promise<Organization[]> => {
  const orgsRef = ref(database, 'organizations');
  const snapshot = await get(orgsRef);
  if (!snapshot.exists()) return [];

  const orgs: Organization[] = [];
  snapshot.forEach((childSnapshot) => {
    orgs.push(childSnapshot.val());
  });
  return orgs;
};

export const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
  const orgRef = ref(database, `organizations/${orgId}`);
  await update(orgRef, updates);
};

// MODIFIED: User operations with organizationId
export const createUser = async (uid: string, userData: Omit<User, 'uid'>) => {
  const userRef = ref(database, `users/${uid}`);
  await set(userRef, { uid, ...userData });
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllUsers = async (organizationId?: string): Promise<User[]> => {
  if (!organizationId) {
    // Super admin can see all users (if needed)
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];

    const users: User[] = [];
    snapshot.forEach((childSnapshot) => {
      users.push(childSnapshot.val());
    });
    return users;
  }

  // Filter by organization
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  if (!snapshot.exists()) return [];

  const users: User[] = [];
  snapshot.forEach((childSnapshot) => {
    const user = childSnapshot.val();
    if (user.organizationId === organizationId) {
      users.push(user);
    }
  });
  return users;
};

export const getUsersByOrganization = async (organizationId: string): Promise<User[]> => {
  return getAllUsers(organizationId);
};

export const updateUser = async (uid: string, updates: Partial<User>) => {
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, updates);
};

export const subscribeToUser = (uid: string, callback: (userData: User | null) => void) => {
  const userRef = ref(database, `users/${uid}`);
  const unsubscribe = onValue(userRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(userRef, 'value', unsubscribe);
};

export const deleteUser = async (uid: string) => {
  const userRef = ref(database, `users/${uid}`);
  await remove(userRef);
};

// MODIFIED: Patient operations with organizationId
export const createPatient = async (organizationId: string, patientData: Omit<Patient, 'id' | 'organizationId'>) => {
  const patientsRef = ref(database, getOrgPath(organizationId, 'patients'));
  const newPatientRef = push(patientsRef);
  const patientId = newPatientRef.key!;
  await set(newPatientRef, { 
    id: patientId, 
    organizationId,
    ...patientData 
  });
  return patientId;
};

export const getPatient = async (organizationId: string, patientId: string): Promise<Patient | null> => {
  const patientRef = ref(database, getOrgPath(organizationId, `patients/${patientId}`));
  const snapshot = await get(patientRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllPatients = async (organizationId: string): Promise<Patient[]> => {
  const patientsRef = ref(database, getOrgPath(organizationId, 'patients'));
  const snapshot = await get(patientsRef);
  if (!snapshot.exists()) return [];

  const patients: Patient[] = [];
  snapshot.forEach((childSnapshot) => {
    patients.push(childSnapshot.val());
  });
  return patients.sort((a, b) => b.createdAt - a.createdAt);
};

export const updatePatient = async (organizationId: string, patientId: string, updates: Partial<Patient>) => {
  const patientRef = ref(database, getOrgPath(organizationId, `patients/${patientId}`));
  await update(patientRef, updates);
};

export const deletePatient = async (organizationId: string, patientId: string) => {
  const patientRef = ref(database, getOrgPath(organizationId, `patients/${patientId}`));
  await remove(patientRef);
};

export const subscribeToPatients = (organizationId: string, callback: (patients: Patient[]) => void) => {
  const patientsRef = ref(database, getOrgPath(organizationId, 'patients'));
  const unsubscribe = onValue(patientsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const patients: Patient[] = [];
    snapshot.forEach((childSnapshot) => {
      patients.push(childSnapshot.val());
    });
    callback(patients.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(patientsRef, 'value', unsubscribe);
};

// MODIFIED: CaseNote operations with organizationId
export const createCaseNote = async (organizationId: string, caseNoteData: Omit<CaseNote, 'id' | 'organizationId'>) => {
  const caseNotesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const newCaseNoteRef = push(caseNotesRef);
  const caseNoteId = newCaseNoteRef.key!;
  await set(newCaseNoteRef, { 
    id: caseNoteId, 
    organizationId,
    ...caseNoteData 
  });
  return caseNoteId;
};

export const getCaseNote = async (organizationId: string, caseNoteId: string): Promise<CaseNote | null> => {
  const caseNoteRef = ref(database, getOrgPath(organizationId, `caseNotes/${caseNoteId}`));
  const snapshot = await get(caseNoteRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllCaseNotes = async (organizationId: string): Promise<CaseNote[]> => {
  const caseNotesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const snapshot = await get(caseNotesRef);
  if (!snapshot.exists()) return [];

  const caseNotes: CaseNote[] = [];
  snapshot.forEach((childSnapshot) => {
    caseNotes.push(childSnapshot.val());
  });
  return caseNotes.sort((a, b) => b.createdAt - a.createdAt);
};

export const updateCaseNote = async (organizationId: string, caseNoteId: string, updates: Partial<CaseNote>) => {
  const caseNoteRef = ref(database, getOrgPath(organizationId, `caseNotes/${caseNoteId}`));
  await update(caseNoteRef, updates);
};

export const deleteCaseNote = async (organizationId: string, caseNoteId: string) => {
  const caseNoteRef = ref(database, getOrgPath(organizationId, `caseNotes/${caseNoteId}`));
  await remove(caseNoteRef);
};

export const subscribeToCaseNotes = (organizationId: string, callback: (caseNotes: CaseNote[]) => void) => {
  const caseNotesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const unsubscribe = onValue(caseNotesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const caseNotes: CaseNote[] = [];
    snapshot.forEach((childSnapshot) => {
      caseNotes.push(childSnapshot.val());
    });
    callback(caseNotes.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(caseNotesRef, 'value', unsubscribe);
};
```

## Step 5: AuthContext (MODIFIED)

### File: `src/contexts/AuthContext.tsx`

**Complete rewrite for organization support:**

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  AuthError,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUser,
  createUser,
  updateUser,
  subscribeToUser,
  getOrganization,
} from "@/services/firebase";
import type { User, UserRole, Organization } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  organization: Organization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    organizationId: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSessionId = () => {
  let sessionId = localStorage.getItem("active_session_id");
  if (!sessionId) {
    sessionId =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("active_session_id", sessionId);
  }
  return sessionId;
};

const CURRENT_SESSION_ID = getSessionId();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        let userData = await getUser(fbUser.uid);

        if (!userData) {
          // User doesn't exist in database
          setUser(null);
          setOrganization(null);
          setLoading(false);
          return;
        }

        setUser(userData);

        // Load organization data
        if (userData.organizationId) {
          try {
            const orgData = await getOrganization(userData.organizationId);
            setOrganization(orgData);
          } catch (error) {
            console.error("Failed to load organization:", error);
            setOrganization(null);
          }
        }

        // Set up session monitoring
        if (unsubscribeUser) unsubscribeUser();
        unsubscribeUser = subscribeToUser(fbUser.uid, (updatedData) => {
          if (updatedData) {
            if (
              updatedData.sessionId &&
              updatedData.sessionId !== CURRENT_SESSION_ID
            ) {
              toast({
                title: "Session Expired",
                description:
                  "You have been logged out because another login was detected.",
                variant: "destructive",
              });
              signOut();
            } else {
              setUser(updatedData);
            }
          }
        });
      } else {
        setUser(null);
        setOrganization(null);
        if (unsubscribeUser) {
          unsubscribeUser();
          unsubscribeUser = null;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateUser(userCredential.user.uid, {
        sessionId: CURRENT_SESSION_ID,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    organizationId: string,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await createUser(userCredential.user.uid, {
        email,
        name,
        role,
        organizationId,
        createdAt: Date.now(),
        sessionId: CURRENT_SESSION_ID,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (user) {
      try {
        const freshData = await getUser(user.uid);
        if (freshData?.sessionId === CURRENT_SESSION_ID) {
          await updateUser(user.uid, { sessionId: "" });
        }
      } catch (e) {
        console.warn("Failed to clear session ID on logout", e);
      }
    }

    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
    setOrganization(null);
  };

  const switchOrganization = async (orgId: string) => {
    if (!user) return;

    try {
      const orgData = await getOrganization(orgId);
      if (!orgData) {
        throw new Error("Organization not found");
      }

      // Update user's organization
      await updateUser(user.uid, { organizationId: orgId });
      setOrganization(orgData);

      toast({
        title: "Organization Switched",
        description: `Switched to ${orgData.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to switch organization",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        organization,
        loading,
        signIn,
        signUp,
        signOut,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

## Step 6: New Pages (CREATE)

### 6.1 Organization Selection Page
**File: `src/pages/OrganizationSelectionPage.tsx`**

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Search } from "lucide-react";
import { getAllOrganizations } from "@/services/firebase";
import type { Organization } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function OrganizationSelectionPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-sky-600" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Organization
          </h1>
          <p className="text-gray-600">
            Choose an organization to continue or create a new one
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/org/${org.id}/dashboard`)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {org.email || org.phone || "No contact info"}
                  </p>
                </CardContent>
              </Card>
            ))}

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-dashed"
              onClick={() => navigate("/organizations/new")}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Set up a new organization for your clinic
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6.2 Create Organization Page
**File: `src/pages/CreateOrganizationPage.tsx`**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowLeft } from "lucide-react";
import { createOrganization } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function CreateOrganizationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"free" | "basic" | "premium">("free");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setLoading(true);
    try {
      const orgId = await createOrganization({
        name,
        email,
        phone,
        address,
        subscriptionPlan,
        isActive: true,
        createdBy: user.uid,
        createdByName: user.name,
        createdAt: Date.now(),
      });

      // Update user with organizationId
      const { updateUser } = await import("@/services/firebase");
      await updateUser(user.uid, { organizationId: orgId });

      toast({
        title: "Organization Created",
        description: "Your organization has been created successfully",
      });

      navigate(`/org/${orgId}/dashboard`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/organizations")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Create New Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select value={subscriptionPlan} onValueChange={(value: any) => setSubscriptionPlan(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Step 7: Update Existing Pages

### 7.1 Update All Pages to Use organizationId

**Pattern for updating pages:**

```typescript
// Before
const patients = await getAllPatients();

// After
const { organization } = useAuth();
const patients = await getAllPatients(organization?.id || "");
```

**Files to update:**
- `src/pages/PatientsPage.tsx`
- `src/pages/PatientDetailPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/PatientFormPage.tsx`
- Any other page that calls Firebase services

### 7.2 Update Router

**File: `src/App.tsx`**

```typescript
// Add new routes
<Route path="/organizations" element={<OrganizationSelectionPage />} />
<Route path="/organizations/new" element={<CreateOrganizationPage />} />
<Route path="/org/:orgId/*" element={<OrganizationLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
  <Route path="patients" element={<PatientsPage />} />
  <Route path="patients/new" element={<PatientFormPage />} />
  <Route path="patients/:patientId" element={<PatientDetailPage />} />
  <Route path="patients/:patientId/edit" element={<PatientFormPage />} />
</Route>
```

## Step 8: Firebase Security Rules

**File: `firebase.json` (or update in Firebase Console)**

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "organizations": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$orgId": {
        ".read": "auth != null",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('organizationId').val() == $orgId || root.child('users').child(auth.uid).child('role').val() == 'admin')"
      }
    },
    
    "users": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
        ".write": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() == 'admin')"
      }
    },
    
    "organizations": {
      "$orgId": {
        "patients": {
          ".read": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
          ".write": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
          "$patientId": {
            ".read": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
            ".write": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId"
          }
        },
        "caseNotes": {
          ".read": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
          ".write": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
          "$caseNoteId": {
            ".read": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId",
            ".write": "auth != null && root.child('users').child(auth.uid).child('organizationId').val() == $orgId"
          }
        }
      }
    }
  }
}
```

## Step 9: Deployment

### 9.1 Build the Project
```bash
cd jash_app_multi_org
npm run build
```

### 9.2 Deploy to Firebase Hosting
```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init

# Select:
# - Hosting
# - Use existing project: jash-physio-multi-org
# - Public directory: dist
# - Configure as single-page app: Yes
# - Set up automatic builds: No

# Deploy
firebase deploy
```

### 9.3 Update Firebase Security Rules
```bash
firebase deploy --only database:rules
```

## Step 10: Testing Checklist

### 10.1 Organization Creation
- [ ] Can create new organization
- [ ] Organization is saved to database
- [ ] User is assigned to organization
- [ ] Can see organization in list

### 10.2 Authentication
- [ ] Can sign up with organization
- [ ] Can sign in with organization
- [ ] Session management works
- [ ] Organization data loads on login

### 10.3 Data Isolation
- [ ] Users can only see their organization's patients
- [ ] Users can only see their organization's case notes
- [ ] Cross-organization data access is blocked

### 10.4 Role-Based Access
- [ ] Admin can manage users
- [ ] Doctor can manage patients
- [ ] Staff can view and edit but not delete

## Summary of Changes

### Files to Copy (No Changes)
- `src/components/` - All UI components
- `src/hooks/` - Custom hooks
- `src/lib/utils.ts` - Utility functions
- `public/` - Static assets
- `index.html` - HTML template
- `vite.config.ts` - Vite configuration
- `package.json` - Dependencies (update name only)

### Files to Modify
- `src/types/index.ts` - Add organization types
- `src/services/firebase.ts` - Add organization-aware functions
- `src/contexts/AuthContext.tsx` - Add organization support
- `src/pages/*` - Update to use organizationId
- `src/App.tsx` - Add organization routes

### Files to Create
- `src/pages/OrganizationSelectionPage.tsx` - NEW
- `src/pages/CreateOrganizationPage.tsx` - NEW
- `.env` - NEW (with new Firebase config)

### Firebase Setup
- Create new Firebase project
- Enable Authentication (Email/Password)
- Enable Realtime Database
- Set up security rules
- Deploy to Firebase Hosting

## Next Steps

1. Copy existing project to new directory
2. Set up new Firebase project
3. Update type definitions
4. Modify Firebase services
5. Update AuthContext
6. Create organization pages
7. Update existing pages to use organizationId
8. Set up security rules
9. Deploy to Firebase Hosting
10. Test thoroughly
