import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  onValue,
  off
} from 'firebase/database';
import { database } from '@/lib/firebase';
import type {
  User,
  Patient,
  Visit,
  DoctorObservation,
  Prescription,
  ExercisePlan,
  CaseNote,
  DashboardStats,
  Organization
} from '@/types';

// Helper function to get organization-scoped path
export const getOrgPath = (organizationId: string, path: string) => {
  return `organizations/${organizationId}/${path}`;
};

// Helper function to remove undefined/null values from an object
const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return undefined;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeData).filter(item => item !== undefined && item !== null);
  }
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const sanitizedValue = sanitizeData(value);
    if (sanitizedValue !== undefined && sanitizedValue !== null) {
      sanitized[key] = sanitizedValue;
    }
  }
  return sanitized;
};

// Organization operations
export const createOrganization = async (orgData: Omit<Organization, 'id'>) => {
  try {
    console.log("createOrganization called with data:", orgData);
    const orgsRef = ref(database, 'organizations');
    const newOrgRef = push(orgsRef);
    const orgId = newOrgRef.key!;
    console.log("New organization ID:", orgId);
    
    const dataToSave = sanitizeData({ id: orgId, ...orgData });
    console.log("Data to save (sanitized):", dataToSave);
    
    await set(newOrgRef, dataToSave);
    console.log("Organization saved successfully to database!");
    
    return orgId;
  } catch (error) {
    console.error("Error in createOrganization:", error);
    throw error;
  }
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

// User operations
export const createUser = async (uid: string, userData: Omit<User, 'uid'>) => {
  const userRef = ref(database, `users/${uid}`);
  await set(userRef, { uid, ...userData });
};

export const getUser = async (uid: string, _organizationId?: string): Promise<User | null> => {
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllUsers = async (organizationId?: string): Promise<User[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  if (!snapshot.exists()) return [];

  const users: User[] = [];
  snapshot.forEach((childSnapshot) => {
    const user = childSnapshot.val();
    if (!organizationId || user.organizationId === organizationId) {
      users.push(user);
    }
  });
  return users;
};

export const getUsersByOrganization = async (organizationId: string): Promise<User[]> => {
  return getAllUsers(organizationId);
};

export const getAllDoctors = async (organizationId?: string): Promise<User[]> => {
  const users = await getAllUsers(organizationId);
  // Filter for only doctors and sort them alphabetically by name
  return users
    .filter((user) => user.role === "doctor")
    .sort((a, b) => a.name.localeCompare(b.name));
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

export const deleteUser = async (uid: string, _organizationId?: string) => {
  const userRef = ref(database, `users/${uid}`);
  await remove(userRef);
};

// Patient operations
export const createPatient = async (organizationId: string, patientData: Omit<Patient, 'id' | 'organizationId'>) => {
  try {
    console.log("createPatient called with orgId:", organizationId, "data:", patientData);
    const patientsRef = ref(database, getOrgPath(organizationId, 'patients'));
    const newPatientRef = push(patientsRef);
    const patientId = newPatientRef.key!;
    console.log("createPatient: new patientId:", patientId);
    const dataToSave = sanitizeData({ id: patientId, organizationId, ...patientData });
    console.log("createPatient: dataToSave (sanitized):", dataToSave);
    await set(newPatientRef, dataToSave);
    console.log("createPatient: saved successfully!");
    return patientId;
  } catch (error) {
    console.error("Error in createPatient:", error);
    throw error;
  }
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
  try {
    console.log("updatePatient called with orgId:", organizationId, "patientId:", patientId, "updates:", updates);
    const patientRef = ref(database, getOrgPath(organizationId, `patients/${patientId}`));
    const dataToUpdate = sanitizeData({ ...updates, updatedAt: Date.now() });
    console.log("updatePatient: dataToUpdate (sanitized):", dataToUpdate);
    await update(patientRef, dataToUpdate);
    console.log("updatePatient: updated successfully!");
  } catch (error) {
    console.error("Error in updatePatient:", error);
    throw error;
  }
};

export const deletePatient = async (organizationId: string, patientId: string) => {
  try {
    console.log(`[deletePatient] Starting deletion for patient: ${patientId}`);

    // Get all related records first
    const [visits, prescriptions, exercisePlans] = await Promise.all([
      getPatientVisits(organizationId, patientId),
      getPatientPrescriptions(organizationId, patientId),
      getPatientExercisePlans(organizationId, patientId)
    ]);

    console.log(`[deletePatient] Found ${visits.length} visits, ${prescriptions.length} prescriptions, ${exercisePlans.length} exercise plans`);

    // Get all visit IDs to delete related observations
    const visitIds = visits.map(v => v.id);

    // Get all doctor observations for these visits
    const observationsRef = ref(database, getOrgPath(organizationId, 'doctorObservations'));
    const observationsSnapshot = await get(observationsRef);
    const observationsToDelete: string[] = [];

    if (observationsSnapshot.exists()) {
      observationsSnapshot.forEach((childSnapshot) => {
        const observation = childSnapshot.val();
        if (visitIds.includes(observation.visitId)) {
          observationsToDelete.push(observation.id);
        }
      });
    }

    console.log(`[deletePatient] Found ${observationsToDelete.length} doctor observations to delete`);

    // Delete all related records
    const deletePromises: Promise<void>[] = [];

    // Delete patient
    const patientRef = ref(database, getOrgPath(organizationId, `patients/${patientId}`));
    deletePromises.push(remove(patientRef));

    // Delete all visits
    visits.forEach(visit => {
      const visitRef = ref(database, getOrgPath(organizationId, `visits/${visit.id}`));
      deletePromises.push(remove(visitRef));
    });

    // Delete all doctor observations
    observationsToDelete.forEach(obsId => {
      const obsRef = ref(database, getOrgPath(organizationId, `doctorObservations/${obsId}`));
      deletePromises.push(remove(obsRef));
    });

    // Delete all prescriptions
    prescriptions.forEach(prescription => {
      const prescriptionRef = ref(database, getOrgPath(organizationId, `prescriptions/${prescription.id}`));
      deletePromises.push(remove(prescriptionRef));
    });

    // Delete all exercise plans
    exercisePlans.forEach(plan => {
      const planRef = ref(database, getOrgPath(organizationId, `exercisePlans/${plan.id}`));
      deletePromises.push(remove(planRef));
    });

    // Execute all deletions
    await Promise.all(deletePromises);

    console.log(`[deletePatient] Successfully deleted patient ${patientId} and all related records`);
  } catch (error) {
    console.error(`[deletePatient] Error deleting patient ${patientId}:`, error);
    throw error;
  }
};

export const searchPatients = async (organizationId: string, searchTerm: string): Promise<Patient[]> => {
  const patients = await getAllPatients(organizationId);
  const lowerSearch = searchTerm.toLowerCase();
  return patients.filter(patient =>
    patient.fullName.toLowerCase().includes(lowerSearch) ||
    patient.phoneNumber.includes(searchTerm)
  );
};

// Visit operations
export const createVisit = async (organizationId: string, visitData: Omit<Visit, 'id' | 'organizationId'>) => {
  const visitsRef = ref(database, getOrgPath(organizationId, 'visits'));
  const newVisitRef = push(visitsRef);
  const visitId = newVisitRef.key!;
  await set(newVisitRef, { id: visitId, organizationId, ...visitData });
  return visitId;
};

export const getVisit = async (organizationId: string, visitId: string): Promise<Visit | null> => {
  const visitRef = ref(database, getOrgPath(organizationId, `visits/${visitId}`));
  const snapshot = await get(visitRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getPatientVisits = async (organizationId: string, patientId: string): Promise<Visit[]> => {
  const visitsRef = ref(database, getOrgPath(organizationId, 'visits'));
  const visitsQuery = query(visitsRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(visitsQuery);

  if (!snapshot.exists()) return [];

  const visits: Visit[] = [];
  snapshot.forEach((childSnapshot) => {
    visits.push(childSnapshot.val());
  });
  return visits.sort((a, b) => (b.visitDate - a.visitDate) || (b.createdAt - a.createdAt));
};

export const getAllVisits = async (organizationId: string): Promise<Visit[]> => {
  const visitsRef = ref(database, getOrgPath(organizationId, 'visits'));
  const snapshot = await get(visitsRef);
  if (!snapshot.exists()) return [];

  const visits: Visit[] = [];
  snapshot.forEach((childSnapshot) => {
    visits.push(childSnapshot.val());
  });
  return visits.sort((a, b) => b.visitDate - a.visitDate);
};

export const updateVisit = async (organizationId: string, visitId: string, updates: Partial<Visit>) => {
  const visitRef = ref(database, getOrgPath(organizationId, `visits/${visitId}`));
  await update(visitRef, { ...updates, updatedAt: Date.now() });
};

export const deleteVisit = async (organizationId: string, visitId: string) => {
  const visitRef = ref(database, getOrgPath(organizationId, `visits/${visitId}`));
  await remove(visitRef);
};

// Doctor observation operations
export const createDoctorObservation = async (organizationId: string, observationData: Omit<DoctorObservation, 'id' | 'organizationId'>) => {
  const observationsRef = ref(database, getOrgPath(organizationId, 'doctorObservations'));
  const newObservationRef = push(observationsRef);
  const observationId = newObservationRef.key!;
  await set(newObservationRef, { id: observationId, organizationId, ...observationData });
  return observationId;
};

export const getDoctorObservation = async (organizationId: string, visitId: string): Promise<DoctorObservation | null> => {
  const observationsRef = ref(database, getOrgPath(organizationId, 'doctorObservations'));
  const observationsQuery = query(observationsRef, orderByChild('visitId'), equalTo(visitId));
  const snapshot = await get(observationsQuery);

  if (!snapshot.exists()) return null;

  let observation: DoctorObservation | null = null;
  snapshot.forEach((childSnapshot) => {
    observation = childSnapshot.val();
  });
  return observation;
};

export const updateDoctorObservation = async (organizationId: string, observationId: string, updates: Partial<DoctorObservation>) => {
  const observationRef = ref(database, getOrgPath(organizationId, `doctorObservations/${observationId}`));
  await update(observationRef, { ...updates, updatedAt: Date.now() });
};

// Prescription operations
export const createPrescription = async (organizationId: string, prescriptionData: Omit<Prescription, 'id' | 'organizationId'>) => {
  const prescriptionsRef = ref(database, getOrgPath(organizationId, 'prescriptions'));
  const newPrescriptionRef = push(prescriptionsRef);
  const prescriptionId = newPrescriptionRef.key!;
  await set(newPrescriptionRef, { id: prescriptionId, organizationId, ...prescriptionData });
  return prescriptionId;
};

export const getPrescription = async (organizationId: string, visitId: string): Promise<Prescription | null> => {
  const prescriptionsRef = ref(database, getOrgPath(organizationId, 'prescriptions'));
  const prescriptionsQuery = query(prescriptionsRef, orderByChild('visitId'), equalTo(visitId));
  const snapshot = await get(prescriptionsQuery);

  if (!snapshot.exists()) return null;

  let prescription: Prescription | null = null;
  snapshot.forEach((childSnapshot) => {
    prescription = childSnapshot.val();
  });
  return prescription;
};

export const getPatientPrescriptions = async (organizationId: string, patientId: string): Promise<Prescription[]> => {
  const prescriptionsRef = ref(database, getOrgPath(organizationId, 'prescriptions'));
  const prescriptionsQuery = query(prescriptionsRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(prescriptionsQuery);

  if (!snapshot.exists()) return [];

  const prescriptions: Prescription[] = [];
  snapshot.forEach((childSnapshot) => {
    prescriptions.push(childSnapshot.val());
  });
  return prescriptions.sort((a, b) => b.createdAt - a.createdAt);
};

export const updatePrescription = async (organizationId: string, prescriptionId: string, updates: Partial<Prescription>) => {
  const prescriptionRef = ref(database, getOrgPath(organizationId, `prescriptions/${prescriptionId}`));
  await update(prescriptionRef, { ...updates, updatedAt: Date.now() });
};

export const deletePrescription = async (organizationId: string, prescriptionId: string) => {
  const prescriptionRef = ref(database, getOrgPath(organizationId, `prescriptions/${prescriptionId}`));
  await remove(prescriptionRef);
};

// Exercise plan operations
export const createExercisePlan = async (organizationId: string, exercisePlanData: Omit<ExercisePlan, 'id' | 'organizationId'>) => {
  const exercisePlansRef = ref(database, getOrgPath(organizationId, 'exercisePlans'));
  const newExercisePlanRef = push(exercisePlansRef);
  const exercisePlanId = newExercisePlanRef.key!;
  await set(newExercisePlanRef, { id: exercisePlanId, organizationId, ...exercisePlanData });
  return exercisePlanId;
};

export const getExercisePlan = async (organizationId: string, visitId: string): Promise<ExercisePlan | null> => {
  const exercisePlansRef = ref(database, getOrgPath(organizationId, 'exercisePlans'));
  const exercisePlansQuery = query(exercisePlansRef, orderByChild('visitId'), equalTo(visitId));
  const snapshot = await get(exercisePlansQuery);

  if (!snapshot.exists()) return null;

  let exercisePlan: ExercisePlan | null = null;
  snapshot.forEach((childSnapshot) => {
    exercisePlan = childSnapshot.val();
  });
  return exercisePlan;
};

export const getPatientExercisePlans = async (organizationId: string, patientId: string): Promise<ExercisePlan[]> => {
  const exercisePlansRef = ref(database, getOrgPath(organizationId, 'exercisePlans'));
  const exercisePlansQuery = query(exercisePlansRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(exercisePlansQuery);

  if (!snapshot.exists()) return [];

  const exercisePlans: ExercisePlan[] = [];
  snapshot.forEach((childSnapshot) => {
    exercisePlans.push(childSnapshot.val());
  });
  return exercisePlans.sort((a, b) => b.createdAt - a.createdAt);
};

export const updateExercisePlan = async (organizationId: string, exercisePlanId: string, updates: Partial<ExercisePlan>) => {
  const exercisePlanRef = ref(database, getOrgPath(organizationId, `exercisePlans/${exercisePlanId}`));
  await update(exercisePlanRef, { ...updates, updatedAt: Date.now() });
};

export const deleteExercisePlan = async (organizationId: string, exercisePlanId: string) => {
  const exercisePlanRef = ref(database, getOrgPath(organizationId, `exercisePlans/${exercisePlanId}`));
  await remove(exercisePlanRef);
};

// Aggregate getters for list pages and summaries
export const getAllDoctorObservations = async (organizationId: string): Promise<DoctorObservation[]> => {
  const observationsRef = ref(database, getOrgPath(organizationId, 'doctorObservations'));
  const snapshot = await get(observationsRef);
  if (!snapshot.exists()) return [];

  const observations: DoctorObservation[] = [];
  snapshot.forEach((childSnapshot) => {
    observations.push(childSnapshot.val());
  });
  return observations.sort((a, b) => b.createdAt - a.createdAt);
};

export const getAllExercisePlans = async (organizationId: string): Promise<ExercisePlan[]> => {
  const exercisePlansRef = ref(database, getOrgPath(organizationId, 'exercisePlans'));
  const snapshot = await get(exercisePlansRef);
  if (!snapshot.exists()) return [];

  const plans: ExercisePlan[] = [];
  snapshot.forEach((childSnapshot) => {
    plans.push(childSnapshot.val());
  });
  return plans.sort((a, b) => b.createdAt - a.createdAt);
};

// Patient-scoped observations list
export const getPatientDoctorObservations = async (organizationId: string, patientId: string): Promise<DoctorObservation[]> => {
  const observationsRef = ref(database, getOrgPath(organizationId, 'doctorObservations'));
  const observationsQuery = query(observationsRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(observationsQuery);

  if (!snapshot.exists()) return [];

  const observations: DoctorObservation[] = [];
  snapshot.forEach((childSnapshot) => {
    observations.push(childSnapshot.val());
  });
  return observations.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteDoctorObservation = async (organizationId: string, observationId: string) => {
  const obsRef = ref(database, getOrgPath(organizationId, `doctorObservations/${observationId}`));
  await remove(obsRef);
};

// Case Notes (Unified entries)
export const createCaseNote = async (organizationId: string, note: Omit<CaseNote, 'id' | 'organizationId'>) => {
  const notesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const newRef = push(notesRef);
  const id = newRef.key!;
  await set(newRef, { id, organizationId, ...note });
  return id;
};

export const updateCaseNote = async (organizationId: string, noteId: string, updates: Partial<CaseNote>) => {
  const noteRef = ref(database, getOrgPath(organizationId, `caseNotes/${noteId}`));
  await update(noteRef, { ...updates, updatedAt: Date.now() });
};

export const deleteCaseNote = async (organizationId: string, noteId: string) => {
  const noteRef = ref(database, getOrgPath(organizationId, `caseNotes/${noteId}`));
  await remove(noteRef);
};

export const getAllCaseNotes = async (organizationId: string): Promise<CaseNote[]> => {
  const notesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const snapshot = await get(notesRef);
  if (!snapshot.exists()) return [];
  const notes: CaseNote[] = [];
  snapshot.forEach((c) => {
    notes.push(c.val());
  });
  return notes.sort((a, b) => b.date - a.date || b.createdAt - a.createdAt);
};

export const getPatientCaseNotes = async (organizationId: string, patientId: string): Promise<CaseNote[]> => {
  const notesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const qy = query(notesRef, orderByChild('patientId'), equalTo(patientId));
  const snapshot = await get(qy);
  if (!snapshot.exists()) return [];
  const notes: CaseNote[] = [];
  snapshot.forEach((c) => {
    notes.push(c.val());
  });
  return notes.sort((a, b) => b.date - a.date || b.createdAt - a.createdAt);
};

// Realtime subscription to all case notes (used by Patients page cards)
export const subscribeToCaseNotes = (organizationId: string, callback: (notes: CaseNote[]) => void) => {
  const notesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const unsubscribe = onValue(notesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const notes: CaseNote[] = [];
    snapshot.forEach((child) => {
      notes.push(child.val());
    });
    notes.sort((a, b) => (b.date - a.date) || (b.createdAt - a.createdAt));
    callback(notes);
  });
  return unsubscribe;
};

// Dashboard statistics
export const getDashboardStats = async (organizationId: string): Promise<DashboardStats> => {
  const patients = await getAllPatients(organizationId);
  const visits = await getAllVisits(organizationId);
  const prescriptions = await getAllPrescriptions(organizationId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTimestamp = today.getTime();
  const todayEndTimestamp = todayEnd.getTime();

  const todayVisits = visits.filter(visit =>
    visit.visitDate >= todayTimestamp && visit.visitDate <= todayEndTimestamp
  );

  // Follow-ups due: visits from 7-14 days ago that might need follow-up
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);
  const followUpsDue = visits.filter(visit =>
    visit.visitDate >= sevenDaysAgo.getTime() &&
    visit.visitDate <= fourteenDaysAgo.getTime()
  ).length;

  // Pending prescriptions: prescriptions created today without completion
  const pendingPrescriptions = prescriptions.filter(p => {
    const prescriptionDate = new Date(p.createdAt);
    return prescriptionDate >= today && prescriptionDate <= todayEnd;
  }).length;

  return {
    totalPatients: patients.length,
    todayVisits: todayVisits.length,
    followUpsDue,
    pendingPrescriptions
  };
};

// Get today's visits
export const getTodayVisits = async (organizationId: string): Promise<Visit[]> => {
  const visits = await getAllVisits(organizationId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const todayTimestamp = today.getTime();
  const todayEndTimestamp = todayEnd.getTime();

  return visits.filter(visit =>
    visit.visitDate >= todayTimestamp && visit.visitDate <= todayEndTimestamp
  );
};

// Get follow-ups due
export const getFollowUpsDue = async (organizationId: string): Promise<Visit[]> => {
  const visits = await getAllVisits(organizationId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);

  return visits.filter(visit =>
    visit.visitDate >= sevenDaysAgo.getTime() &&
    visit.visitDate <= fourteenDaysAgo.getTime()
  );
};

// Get all prescriptions
export const getAllPrescriptions = async (organizationId: string): Promise<Prescription[]> => {
  const prescriptionsRef = ref(database, getOrgPath(organizationId, 'prescriptions'));
  const snapshot = await get(prescriptionsRef);
  if (!snapshot.exists()) return [];

  const prescriptions: Prescription[] = [];
  snapshot.forEach((childSnapshot) => {
    prescriptions.push(childSnapshot.val());
  });
  return prescriptions.sort((a, b) => b.createdAt - a.createdAt);
};

// Get pending prescriptions
export const getPendingPrescriptions = async (organizationId: string): Promise<Prescription[]> => {
  const prescriptions = await getAllPrescriptions(organizationId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  return prescriptions.filter(p => {
    const prescriptionDate = new Date(p.createdAt);
    return prescriptionDate >= today && prescriptionDate <= todayEnd;
  });
};

// Real-time listeners
export const subscribeToPatients = (organizationId: string, callback: (patients: Patient[]) => void) => {
  const patientsRef = ref(database, getOrgPath(organizationId, 'patients'));
  onValue(patientsRef, (snapshot) => {
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

  return () => off(patientsRef);
};

export const subscribeToPatient = (organizationId: string, patientId: string, callback: (patient: Patient | null) => void) => {
  const patientRef = ref(database, getOrgPath(organizationId, `patients/${patientId}`));
  const unsubscribe = onValue(patientRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(patientRef, 'value', unsubscribe);
};

export const subscribeToPatientVisits = (organizationId: string, patientId: string, callback: (visits: Visit[]) => void) => {
  const visitsRef = ref(database, getOrgPath(organizationId, 'visits'));
  const visitsQuery = query(visitsRef, orderByChild('patientId'), equalTo(patientId));
  const unsubscribe = onValue(visitsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const visits: Visit[] = [];
    snapshot.forEach((childSnapshot) => {
      visits.push(childSnapshot.val());
    });
    callback(visits.sort((a, b) => b.visitDate - a.visitDate));
  });

  return () => off(visitsQuery, 'value', unsubscribe);
};

export const subscribeToPatientPrescriptions = (organizationId: string, patientId: string, callback: (prescriptions: Prescription[]) => void) => {
  const prescriptionsRef = ref(database, getOrgPath(organizationId, 'prescriptions'));
  const prescriptionsQuery = query(prescriptionsRef, orderByChild('patientId'), equalTo(patientId));
  const unsubscribe = onValue(prescriptionsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const prescriptions: Prescription[] = [];
    snapshot.forEach((childSnapshot) => {
      prescriptions.push(childSnapshot.val());
    });
    callback(prescriptions.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(prescriptionsQuery, 'value', unsubscribe);
};

export const subscribeToPatientExercisePlans = (organizationId: string, patientId: string, callback: (plans: ExercisePlan[]) => void) => {
  const plansRef = ref(database, getOrgPath(organizationId, 'exercisePlans'));
  const plansQuery = query(plansRef, orderByChild('patientId'), equalTo(patientId));
  const unsubscribe = onValue(plansQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const plans: ExercisePlan[] = [];
    snapshot.forEach((childSnapshot) => {
      plans.push(childSnapshot.val());
    });
    callback(plans.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(plansQuery, 'value', unsubscribe);
};

export const subscribeToPatientDoctorObservations = (organizationId: string, patientId: string, callback: (obs: DoctorObservation[]) => void) => {
  const obsRef = ref(database, getOrgPath(organizationId, 'doctorObservations'));
  const obsQuery = query(obsRef, orderByChild('patientId'), equalTo(patientId));
  const unsubscribe = onValue(obsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const obs: DoctorObservation[] = [];
    snapshot.forEach((childSnapshot) => {
      obs.push(childSnapshot.val());
    });
    callback(obs.sort((a, b) => b.createdAt - a.createdAt));
  });
  return () => off(obsQuery, 'value', unsubscribe);
};

export const subscribeToPatientCaseNotes = (organizationId: string, patientId: string, callback: (notes: any[]) => void) => {
  const notesRef = ref(database, getOrgPath(organizationId, 'caseNotes'));
  const notesQuery = query(notesRef, orderByChild('patientId'), equalTo(patientId));
  const unsubscribe = onValue(notesQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const notes: any[] = [];
    snapshot.forEach((childSnapshot) => {
      notes.push(childSnapshot.val());
    });
    callback(notes.sort((a, b) => b.date - a.date || b.createdAt - a.createdAt));
  });
  return () => off(notesQuery, 'value', unsubscribe);
};

export const subscribeToVisits = (organizationId: string, callback: (visits: Visit[]) => void) => {
  const visitsRef = ref(database, getOrgPath(organizationId, 'visits'));
  onValue(visitsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const visits: Visit[] = [];
    snapshot.forEach((childSnapshot) => {
      visits.push(childSnapshot.val());
    });
    callback(visits.sort((a, b) => b.visitDate - a.visitDate));
  });

  return () => off(visitsRef);
};
