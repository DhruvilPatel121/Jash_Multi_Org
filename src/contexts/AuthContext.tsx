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
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUser,
  createUser,
  updateUser,
  subscribeToUser,
  getOrganization,
  getAllUsers,
} from "@/services/firebase";
import type { User, UserRole, Organization } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  organization: Organization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  createUserAsSuperAdmin: (
    email: string,
    password: string,
    name: string,
    role: Exclude<UserRole, "superadmin">,
    organizationId: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or retrieve a unique session ID for this device/browser
// We use localStorage so the ID persists across app sessions and browser restarts
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
        // Set up a listener FIRST, so that even if user is created later, we get updates!
        if (unsubscribeUser) unsubscribeUser();
        unsubscribeUser = subscribeToUser(fbUser.uid, async (updatedData) => {
          if (updatedData) {
            // Check if another session has logged in
            if (
              updatedData.sessionId &&
              updatedData.sessionId !== CURRENT_SESSION_ID
            ) {
              // Another login detected! Force logout.
              toast({
                title: "Session Expired",
                description:
                  "You have been logged out because another login was detected with these credentials.",
                variant: "destructive",
              });
              signOut();
            } else {
              setUser(updatedData);
              // Also reload organization if organizationId changes!
              if (
                updatedData.organizationId &&
                (!organization ||
                  organization.id !== updatedData.organizationId)
              ) {
                try {
                  const orgData = await getOrganization(
                    updatedData.organizationId,
                  );
                  setOrganization(orgData);
                } catch (error) {
                  console.error("Failed to load organization:", error);
                  setOrganization(null);
                }
              } else if (!updatedData.organizationId) {
                setOrganization(null);
              }
            }
          } else {
            // No user data in DB yet!
            setUser(null);
            setOrganization(null);
          }
        });

        // Fetch initial user data
        let initialUserData = await getUser(fbUser.uid);
        if (!initialUserData) {
          // Check if this is the first user (no users in DB yet)
          const allUsers = await getAllUsers();
          const isFirstUser = allUsers.length === 0;

          // Create user in DB
          initialUserData = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "Admin",
            role: isFirstUser ? "superadmin" : "admin", // First user is superadmin!
            organizationId: "",
            createdAt: Date.now(),
            sessionId: CURRENT_SESSION_ID,
          };
          await createUser(fbUser.uid, initialUserData);
        }

        setUser(initialUserData);
        if (initialUserData.organizationId) {
          try {
            const orgData = await getOrganization(
              initialUserData.organizationId,
            );
            setOrganization(orgData);
          } catch (error) {
            console.error("Failed to load organization:", error);
            setOrganization(null);
          }
        }
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

      // Update the sessionId in the database upon successful login
      await updateUser(userCredential.user.uid, {
        sessionId: CURRENT_SESSION_ID,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const createUserAsSuperAdmin = async (
    email: string,
    password: string,
    name: string,
    role: Exclude<UserRole, "superadmin">,
    organizationId: string,
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Create user profile in database
      await createUser(userCredential.user.uid, {
        uid: userCredential.user.uid,
        email,
        name,
        role,
        organizationId,
        createdAt: Date.now(),
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Optional: Clear sessionId in DB on manual logout to allow immediate re-login elsewhere
    if (user) {
      try {
        // Only clear if it's OUR session being logged out
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
        createUserAsSuperAdmin,
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
