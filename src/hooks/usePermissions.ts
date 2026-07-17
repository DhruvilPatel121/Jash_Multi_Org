import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

/**
 * Custom hook for checking user permissions
 * 
 * Role hierarchy:
 * - admin/doctor: Full permissions including delete
 * - staff: Can create and edit all records but cannot delete patients
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user can delete patients
   * Only admin and doctor roles can delete patients
   */
  const canDeletePatient = (): boolean => {
    return user?.role === 'admin' || user?.role === 'doctor';
  };

  /**
   * Check if user can delete visits, prescriptions, or exercise plans
   * All authenticated roles (admin, doctor, staff) can delete timeline records
   * Note: patient deletion is still restricted by canDeletePatient
   */
  const canDeleteRecords = (): boolean => {
    return !!user && (user.role === 'admin' || user.role === 'doctor' || user.role === 'staff');
  };

  /**
   * Check if user can edit records (visits, observations, prescriptions, exercises)
   * All authenticated users (admin, doctor, staff) can edit
   */
  const canEditRecords = (): boolean => {
    return !!user && (user.role === 'admin' || user.role === 'doctor' || user.role === 'staff');
  };

  /**
   * Check if user can create records
   * All authenticated users can create records
   */
  const canCreateRecords = (): boolean => {
    return !!user && (user.role === 'admin' || user.role === 'doctor' || user.role === 'staff');
  };

  /**
   * Check if user is admin or doctor (main doctor)
   */
  const isAdminOrDoctor = (): boolean => {
    return user?.role === "admin" || user?.role === "doctor";
  };

  /**
   * Check if user can manage doctors (add/remove)
   * Only admin can manage doctors
   */
  const canManageDoctors = (): boolean => {
    return user?.role === "admin";
  };

  /**
   * Check if user is staff
   */
  const isStaff = (): boolean => {
    return user?.role === 'staff';
  };

  return {
    canDeletePatient,
    canDeleteRecords,
    canEditRecords,
    canCreateRecords,
    isAdminOrDoctor,
    canManageDoctors,
    isStaff,
    user,
  };
}
