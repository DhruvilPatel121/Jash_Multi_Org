import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { subscribeToPatients } from "@/services/firebase";
import type { Patient } from "@/types";
import { useAuth } from "./AuthContext";
import { getCurrentSessionAttendanceCount } from "@/lib/utils";

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  type: "warning" | "error";
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, organization } = useAuth();

  useEffect(() => {
    if (!user || !user.organizationId) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToPatients(user.organizationId, (patients) => {
      const newNotifications: Notification[] = [];

      patients.forEach((patient) => {
        if (!patient.paidDays || patient.paidDays <= 0) return;

        const currentSessionCount = getCurrentSessionAttendanceCount(patient);

        if (currentSessionCount >= patient.paidDays) {
          newNotifications.push({
            id: `limit-${patient.id}`,
            patientId: patient.id!,
            patientName: patient.fullName,
            message: `Payment limit reached (${currentSessionCount}/${patient.paidDays} days).`,
            type: "error",
            timestamp: Date.now(),
          });
        } else if (currentSessionCount === patient.paidDays - 1) {
          newNotifications.push({
            id: `warning-${patient.id}`,
            patientId: patient.id!,
            patientName: patient.fullName,
            message: `Payment limit nearing (${currentSessionCount}/${patient.paidDays} days). 1 day remaining.`,
            type: "warning",
            timestamp: Date.now(),
          });
        }
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user, user?.organizationId]);

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, clearNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
