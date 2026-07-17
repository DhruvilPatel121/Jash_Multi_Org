export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// Organization types
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

// Unified case note combining complaint, diagnosis, findings, precautions, Rx plan, and exercise protocol
export interface CaseNote {
  id: string;
  organizationId: string;
  patientId: string;
  patientName: string;
  date: number; // timestamp for the case date
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

/**
 * User roles with hierarchical permissions:
 * - 'admin' or 'doctor': Main doctor with full permissions including patient deletion
 * - 'staff': Staff members who can create and edit all records but cannot delete patients
 */
export type UserRole = 'superadmin' | 'doctor' | 'staff' | 'admin';

// User type
export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  createdAt: number;
  sessionId?: string; // To track active session and prevent multiple logins
  isActive?: boolean;
}

// Patient type
export interface Patient {
  id: string;
  organizationId: string;
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
  // Clinical fields captured at registration
  complaint?: string; // chief complaint
  investigation?: string; // MRI/X-ray/other investigation notes
  diagnosis?: string; // doctor diagnosis summary
  precautions?: string; // warnings and precautions
  paymentDetails?: string; // payment details (numeric only) - from Personal Info
  attendancePaymentDetails?: string; // payment details displayed above attendance
  treatmentPlan?: {
    electroTherapy?: string[];
    exerciseTherapy?: string[];
  };
  attendance?: Record<string, 'present' | 'absent'>;
  paidDays?: number; // Total days in CURRENT session
  paymentHistory?: Array<{
    days: number;
    timestamp: number;
    notes?: string;
    completedDates?: string[];
  }>;
  assignedDoctorId?: string; // ID of the doctor assigned to this patient
  assignedDoctorName?: string; // Name of the doctor assigned to this patient
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: number;
}

// Visit type
export interface Visit {
  id: string;
  organizationId: string;
  patientId: string;
  patientName: string;
  visitDate: number;
  chiefComplaint: string;
  durationOfProblem?: string;
  previousTreatment?: string;
  painSeverity?: number;
  attendingStaff: string;
  attendingStaffName: string;
  visitNotes?: string;
  createdAt: number;
  updatedAt: number;
}

// Doctor observation type
export interface DoctorObservation {
  id: string;
  organizationId: string;
  visitId: string;
  patientId: string;
  examinationFindings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  estimatedRecoveryTime?: string;
  warningsAndPrecautions?: string;
  doctorNotes?: string;
  doctorId: string;
  doctorName: string;
  createdAt: number;
  updatedAt: number;
}

// Medicine type
export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// Prescription type
export interface Prescription {
  id: string;
  organizationId: string;
  patientId: string;
  patientName: string;
  visitId: string;
  medicines: Medicine[];
  prescribedBy: string;
  prescribedByName: string;
  createdAt: number;
  updatedAt: number;
}

// Exercise type
export interface Exercise {
  name: string;
  repetitions: string;
  sets: string;
  frequency: string;
  duration: string;
}

// Exercise plan type
export interface ExercisePlan {
  id: string;
  organizationId: string;
  patientId: string;
  patientName: string;
  visitId: string;
  exercises: Exercise[];
  prescribedBy: string;
  prescribedByName: string;
  createdAt: number;
  updatedAt: number;
}

// Dashboard stats type
export interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  followUpsDue: number;
  pendingPrescriptions: number;
}

