import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getPatient,
  getPatientVisits,
  getPatientPrescriptions,
  getPatientExercisePlans,
  getPatientDoctorObservations,
  createVisit,
  createDoctorObservation,
  createExercisePlan,
  createCaseNote,
  getPatientCaseNotes,
  deleteCaseNote,
  updateVisit,
  deleteVisit,
  updateDoctorObservation,
  deleteDoctorObservation,
  updatePatient,
  deletePatient,
  getAllPatients,
  subscribeToPatient,
  subscribeToPatientVisits,
  subscribeToPatientPrescriptions,
  subscribeToPatientExercisePlans,
  subscribeToPatientDoctorObservations,
} from "@/services/firebase";
import type {
  Patient,
  Visit,
  Prescription,
  ExercisePlan,
  DoctorObservation,
} from "@/types";
import { AttendanceCalendar } from "@/components/patients/AttendanceCalendar";
import { format } from "date-fns";
import { getCurrentSessionAttendanceCount } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User,
  Loader2,
  FileText,
  Activity,
  History,
} from "lucide-react";

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const { canDeletePatient } = usePermissions();
  const organizationId = organization?.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [observations, setObservations] = useState<DoctorObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [patientNumber, setPatientNumber] = useState<number | null>(null);

  // Edit dialogs state
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [visitForm, setVisitForm] = useState({
    visitDate: "",
    chiefComplaint: "",
    painSeverity: "",
    visitNotes: "",
  });

  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [editingObservation, setEditingObservation] =
    useState<DoctorObservation | null>(null);
  const [observationForm, setObservationForm] = useState({
    diagnosis: "",
    examinationFindings: "",
    warningsAndPrecautions: "",
    treatmentPlan: "",
  });
  // For Add Visit: dedicated fields for MRI/X-ray and Exercise protocol text
  const [mriFinding, setMriFinding] = useState("");
  const [xrayFinding, setXrayFinding] = useState("");
  const [exerciseProtocol, setExerciseProtocol] = useState("");

  const [editTreatmentPlanOpen, setEditTreatmentPlanOpen] = useState(false);
  const [treatmentPlanForm, setTreatmentPlanForm] = useState({
    electroTherapy: "",
    exerciseTherapy: "",
  });

  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [newExerciseText, setNewExerciseText] = useState("");

  const [editExerciseDialogOpen, setEditExerciseDialogOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<
    number | null
  >(null);
  const [editingExerciseText, setEditingExerciseText] = useState("");

  const [editElectroDialogOpen, setEditElectroDialogOpen] = useState(false);
  const [editingElectroIndex, setEditingElectroIndex] = useState<number | null>(
    null,
  );
  const [editingElectroText, setEditingElectroText] = useState("");

  const [editPaymentDetailsOpen, setEditPaymentDetailsOpen] = useState(false);
  const [paymentDetailsText, setPaymentDetailsText] = useState("");

  const [editPaidDaysOpen, setEditPaidDaysOpen] = useState(false);
  const [paidDaysValue, setPaidDaysValue] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);

  const [historyIndexToDelete, setHistoryIndexToDelete] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!id || !organizationId) return;

    const unsubPatient = subscribeToPatient(organizationId, id, (data) =>
      setPatient(data),
    );
    const unsubVisits = subscribeToPatientVisits(organizationId, id, (data) =>
      setVisits(data),
    );
    const unsubPrescriptions = subscribeToPatientPrescriptions(
      organizationId,
      id,
      (data) => setPrescriptions(data),
    );
    const unsubPlans = subscribeToPatientExercisePlans(
      organizationId,
      id,
      (data) => setExercisePlans(data),
    );
    const unsubObs = subscribeToPatientDoctorObservations(
      organizationId,
      id,
      (data) => setObservations(data),
    );

    // Also load data initially to set loading to false
    loadPatientData();

    return () => {
      unsubPatient();
      unsubVisits();
      unsubPrescriptions();
      unsubPlans();
      unsubObs();
    };
  }, [id, organizationId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const num = searchParams.get("num");
    if (num) {
      setPatientNumber(parseInt(num, 10));
    } else if (patient && id && organizationId) {
      // Fallback if num is not in URL: calculate it month-wise
      const targetMonth = format(new Date(patient.createdAt), "MM");
      const targetYear = format(new Date(patient.createdAt), "yyyy");

      getAllPatients(organizationId).then((allPatients) => {
        const patientsInMonth = allPatients.filter((p) => {
          if (!p.createdAt) return false;
          const ca = new Date(p.createdAt);
          return (
            format(ca, "MM") === targetMonth &&
            format(ca, "yyyy") === targetYear
          );
        });

        const sorted = [...patientsInMonth].sort((a, b) => {
          const ac = a.createdAt || 0;
          const bc = b.createdAt || 0;
          if (ac !== bc) return ac - bc;
          return (a.id || "").localeCompare(b.id || "");
        });
        const patientIndex = sorted.findIndex((p) => p.id === id);
        if (patientIndex !== -1) {
          setPatientNumber(patientIndex + 1);
        }
      });
    }
  }, [id, location.search, patient, organizationId]);

  const openEditTreatmentPlan = () => {
    setTreatmentPlanForm({
      electroTherapy: patient?.treatmentPlan?.electroTherapy?.join("\n") || "",
      exerciseTherapy:
        patient?.treatmentPlan?.exerciseTherapy?.join("\n") || "",
    });
    setEditTreatmentPlanOpen(true);
  };

  const saveTreatmentPlan = async () => {
    if (!patient || !id) return;
    try {
      // Clean up electro therapy: remove extra newlines and empty lines
      const electro = treatmentPlanForm.electroTherapy
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Clean up exercise therapy: treat as single block with newlines (like add exercise)
      // Replace multiple newlines with single newline, trim whitespace
      const exercise = treatmentPlanForm.exerciseTherapy
        .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
        .trim();

      // Only include exercise if it's not empty
      const exerciseArray = exercise.length > 0 ? [exercise] : [];

      await updatePatient(organizationId, id, {
        treatmentPlan: {
          electroTherapy: electro,
          exerciseTherapy: exerciseArray,
        },
      });

      // Optimistic update
      setPatient({
        ...patient,
        treatmentPlan: {
          electroTherapy: electro,
          exerciseTherapy: exerciseArray,
        },
      });

      setEditTreatmentPlanOpen(false);
      toast({ title: "Success", description: "Treatment plan updated" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update treatment plan",
        variant: "destructive",
      });
    }
  };

  const openAddExercise = () => {
    setNewExerciseText("");
    setAddExerciseDialogOpen(true);
  };

  const saveNewExercise = async () => {
    if (!patient || !id || !newExerciseText.trim()) return;
    try {
      const existingExercises = patient.treatmentPlan?.exerciseTherapy || [];

      // Clean up input: remove extra newlines (that would create empty boxes)
      // Replace multiple newlines with single newline, trim whitespace
      const cleanedExercise = newExerciseText
        .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
        .trim();

      // Only add if not empty after cleaning
      if (!cleanedExercise) return;

      // Clean up existing exercises too (remove any empty blocks)
      const cleanedExistingExercises = existingExercises.filter(
        (exercise) => exercise.trim().length > 0,
      );

      const newExercises = [cleanedExercise, ...cleanedExistingExercises];

      await updatePatient(organizationId, id, {
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          exerciseTherapy: newExercises,
        },
      });

      setPatient({
        ...patient,
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          exerciseTherapy: newExercises,
        },
      });

      setAddExerciseDialogOpen(false);
      setNewExerciseText("");
      toast({ title: "Success", description: "Exercise added successfully" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive",
      });
    }
  };

  const openEditExercise = (index: number) => {
    const exercises = patient?.treatmentPlan?.exerciseTherapy || [];
    setEditingExerciseIndex(index);
    setEditingExerciseText(exercises[index] || "");
    setEditExerciseDialogOpen(true);
  };

  const saveEditedExercise = async () => {
    if (!patient || !id || editingExerciseIndex === null) return;
    try {
      const existingExercises = patient.treatmentPlan?.exerciseTherapy || [];

      // Clean up input: remove extra newlines (that would create empty boxes)
      const cleanedExercise = editingExerciseText
        .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
        .trim();

      // If cleaned text is empty, remove the box instead of keeping it empty
      let updatedExercises;
      if (!cleanedExercise) {
        updatedExercises = existingExercises.filter(
          (_, i) => i !== editingExerciseIndex,
        );
      } else {
        updatedExercises = [...existingExercises];
        updatedExercises[editingExerciseIndex] = cleanedExercise;
      }

      await updatePatient(organizationId, id, {
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          exerciseTherapy: updatedExercises,
        },
      });

      setPatient({
        ...patient,
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          exerciseTherapy: updatedExercises,
        },
      });

      setEditExerciseDialogOpen(false);
      setEditingExerciseIndex(null);
      setEditingExerciseText("");
      toast({
        title: "Success",
        description: cleanedExercise
          ? "Exercise updated successfully"
          : "Exercise removed successfully",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update exercise",
        variant: "destructive",
      });
    }
  };

  const deleteExercise = async (index: number) => {
    if (!patient || !id) return;
    try {
      const existingExercises = patient.treatmentPlan?.exerciseTherapy || [];
      const updatedExercises = existingExercises.filter((_, i) => i !== index);

      await updatePatient(organizationId, id, {
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          exerciseTherapy: updatedExercises,
        },
      });

      setPatient({
        ...patient,
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          exerciseTherapy: updatedExercises,
        },
      });

      toast({ title: "Success", description: "Exercise deleted successfully" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive",
      });
    }
  };

  const openEditElectro = (index: number) => {
    const electroTherapies = patient?.treatmentPlan?.electroTherapy || [];
    setEditingElectroIndex(index);
    setEditingElectroText(electroTherapies[index] || "");
    setEditElectroDialogOpen(true);
  };

  const saveEditedElectro = async () => {
    if (!patient || !id || editingElectroIndex === null) return;
    try {
      const existingElectros = patient.treatmentPlan?.electroTherapy || [];

      // Clean up input: remove extra newlines
      const cleanedElectro = editingElectroText
        .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
        .trim();

      // If cleaned text is empty, remove the box instead of keeping it empty
      let updatedElectros;
      if (!cleanedElectro) {
        updatedElectros = existingElectros.filter(
          (_, i) => i !== editingElectroIndex,
        );
      } else {
        updatedElectros = [...existingElectros];
        updatedElectros[editingElectroIndex] = cleanedElectro;
      }

      await updatePatient(organizationId, id, {
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          electroTherapy: updatedElectros,
        },
      });

      setPatient({
        ...patient,
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          electroTherapy: updatedElectros,
        },
      });

      setEditElectroDialogOpen(false);
      setEditingElectroIndex(null);
      setEditingElectroText("");
      toast({
        title: "Success",
        description: cleanedElectro
          ? "Electro therapy updated successfully"
          : "Electro therapy removed successfully",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update electro therapy",
        variant: "destructive",
      });
    }
  };

  const deleteElectro = async (index: number) => {
    if (!patient || !id) return;
    try {
      const existingElectros = patient.treatmentPlan?.electroTherapy || [];
      const updatedElectros = existingElectros.filter((_, i) => i !== index);

      await updatePatient(organizationId, id, {
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          electroTherapy: updatedElectros,
        },
      });

      setPatient({
        ...patient,
        treatmentPlan: {
          ...(patient.treatmentPlan || {}),
          electroTherapy: updatedElectros,
        },
      });

      toast({
        title: "Success",
        description: "Electro therapy deleted successfully",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete electro therapy",
        variant: "destructive",
      });
    }
  };

  const openEditPaymentDetails = () => {
    setPaymentDetailsText(patient?.attendancePaymentDetails || "");
    setEditPaymentDetailsOpen(true);
  };

  const savePaymentDetails = async () => {
    if (!patient || !id) return;
    try {
      await updatePatient(organizationId, id, {
        attendancePaymentDetails: paymentDetailsText,
      });

      setPatient({
        ...patient,
        attendancePaymentDetails: paymentDetailsText,
      });

      setEditPaymentDetailsOpen(false);
      toast({ title: "Success", description: "Payment details updated" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update payment details",
        variant: "destructive",
      });
    }
  };

  const openEditPaidDays = () => {
    setPaidDaysValue(patient?.paidDays?.toString() || "");
    setIsRenewing(false);
    setEditPaidDaysOpen(true);
  };

  const openRenewPaidDays = () => {
    setPaidDaysValue("");
    setIsRenewing(true);
    setEditPaidDaysOpen(true);
  };

  const currentSessionCount = getCurrentSessionAttendanceCount(patient);

  const getSessionName = (index: number) => {
    if (!patient?.paymentHistory) return "";
    const totalSessions = patient.paymentHistory.length;
    const sessionNumber = totalSessions - index;

    // Convert to ordinal (1st, 2nd, 3rd...)
    const j = sessionNumber % 10,
      k = sessionNumber % 100;
    if (j === 1 && k !== 11) {
      return sessionNumber + "st Session";
    }
    if (j === 2 && k !== 12) {
      return sessionNumber + "nd Session";
    }
    if (j === 3 && k !== 13) {
      return sessionNumber + "rd Session";
    }
    return sessionNumber + "th Session";
  };

  const savePaidDays = async () => {
    if (!patient || !id) return;
    try {
      const newValue = paidDaysValue.trim() ? parseInt(paidDaysValue) : null;

      let updates: any = {
        paidDays: newValue,
      };

      if (isRenewing && newValue !== null) {
        // Find ALL present dates that haven't been archived yet
        const archivedDates = (patient.paymentHistory || []).flatMap(
          (h) => h.completedDates || [],
        );
        const archivedSet = new Set(archivedDates);

        const currentAttendance = patient.attendance || {};
        const presentDates = Object.entries(currentAttendance)
          .filter(
            ([date, status]) => status === "present" && !archivedSet.has(date),
          )
          .map(([date, _]) => date);

        // Even if presentDates is empty, we archive the session limit if it was > 0
        if ((patient.paidDays || 0) > 0) {
          const historyItem = {
            days: patient.paidDays || 0,
            timestamp: Date.now(),
            completedDates: presentDates,
          };
          updates.paymentHistory = [
            historyItem,
            ...(patient.paymentHistory || []),
          ];
        }
      }

      await updatePatient(organizationId, id, updates);

      setPatient({
        ...patient,
        ...updates,
      });

      setEditPaidDaysOpen(false);
      toast({
        title: "Success",
        description: isRenewing ? "New session started" : "Paid days updated",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update paid days",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaymentHistory = async (index: number) => {
    if (!patient || !id || !patient.paymentHistory) return;

    try {
      const historyItem = patient.paymentHistory[index];
      const datesToRemove = historyItem.completedDates || [];

      const newHistory = [...patient.paymentHistory];
      newHistory.splice(index, 1);

      const updatedAttendance = { ...(patient.attendance || {}) };
      datesToRemove.forEach((dateKey) => {
        delete updatedAttendance[dateKey];
      });

      const updates: any = {
        paymentHistory: newHistory,
        attendance: updatedAttendance,
      };

      await updatePatient(organizationId, id, updates);

      setPatient({
        ...patient,
        ...updates,
      });

      toast({
        title: "Success",
        description: "Payment history and associated attendance deleted",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete payment history item",
        variant: "destructive",
      });
    }
  };

  const loadPatientData = async () => {
    if (!organizationId) return;
    try {
      const [
        patientData,
        visitsData,
        prescriptionsData,
        exercisePlansData,
        observationsData,
      ] = await Promise.all([
        getPatient(organizationId, id!),
        getPatientVisits(organizationId, id!),
        getPatientPrescriptions(organizationId, id!),
        getPatientExercisePlans(organizationId, id!),
        getPatientDoctorObservations(organizationId, id!),
      ]);

      setPatient(patientData);
      setVisits(visitsData);
      setPrescriptions(prescriptionsData);
      setExercisePlans(exercisePlansData);
      setObservations(observationsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (
    date: Date,
    status: "present" | "absent" | "consulting" | null,
  ) => {
    if (!patient || !id || !organizationId) return;

    const dateKey = format(date, "yyyy-MM-dd");
    const updatedAttendance = { ...(patient.attendance || {}) };

    if (status) {
      updatedAttendance[dateKey] = status;
    } else {
      delete updatedAttendance[dateKey];
    }

    // Optimistic update
    setPatient({ ...patient, attendance: updatedAttendance });

    try {
      await updatePatient(organizationId, id, {
        attendance: updatedAttendance,
      });
    } catch (error) {
      console.error("Failed to update attendance", error);
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
      loadPatientData();
    }
  };

  // Open create visit dialog
  const openAddVisit = () => {
    setEditingVisit(null);
    setVisitForm({
      visitDate: new Date().toISOString().slice(0, 10),
      chiefComplaint: "",
      painSeverity: "",
      visitNotes: "",
    });
    setObservationForm({
      diagnosis: "",
      examinationFindings: "",
      warningsAndPrecautions: "",
      treatmentPlan: "",
    });
    setMriFinding("");
    setXrayFinding("");
    setExerciseProtocol("");
    setVisitDialogOpen(true);
  };

  // Visit edit/delete handlers
  const openEditVisit = (v: Visit) => {
    setEditingVisit(v);
    setVisitForm({
      visitDate: new Date(v.visitDate).toISOString().slice(0, 10),
      chiefComplaint: v.chiefComplaint || "",
      painSeverity: (v.painSeverity ?? "").toString(),
      visitNotes: v.visitNotes || "",
    });
    // Prefill diagnosis / MRI / X-ray / precautions / Rx / exercise
    const obs = observations.find((o) => o.visitId === v.id) || null;
    if (obs) {
      setObservationForm({
        diagnosis: obs.diagnosis || "",
        examinationFindings: "",
        warningsAndPrecautions: obs.warningsAndPrecautions || "",
        treatmentPlan: obs.treatmentPlan || "",
      });
      // Parse findings into MRI/X-ray and other
      const findings = obs.examinationFindings || "";
      let mri = "";
      let xray = "";
      const rest: string[] = [];
      findings.split("\n").forEach((line) => {
        const t = line.trim();
        if (/^MRI\s*:/.test(t)) mri = t.replace(/^MRI\s*:\s*/i, "");
        else if (/^X-?ray\s*:/.test(t)) xray = t.replace(/^X-?ray\s*:\s*/i, "");
        else if (t) rest.push(t);
      });
      setMriFinding(mri);
      setXrayFinding(xray);
      // Put remaining findings back into observationForm.examinationFindings
      setObservationForm((prev) => ({
        ...prev,
        examinationFindings: rest.join("\n"),
      }));
    } else {
      setObservationForm({
        diagnosis: "",
        examinationFindings: "",
        warningsAndPrecautions: "",
        treatmentPlan: "",
      });
      setMriFinding("");
      setXrayFinding("");
    }
    const ex = exercisePlans.find((e) => e.visitId === v.id) || null;
    setExerciseProtocol(ex?.exercises?.[0]?.name || "");
    setVisitDialogOpen(true);
  };

  const saveVisit = async () => {
    try {
      if (editingVisit) {
        const updates: any = {
          visitDate: new Date(visitForm.visitDate).getTime(),
          chiefComplaint: visitForm.chiefComplaint,
        };
        if (visitForm.painSeverity !== "")
          updates.painSeverity = Number(visitForm.painSeverity);
        if (visitForm.visitNotes) updates.visitNotes = visitForm.visitNotes;
        await updateVisit(organizationId, editingVisit.id, updates);
        // Upsert Observation and Exercise for this visit
        const combinedFindings = [
          mriFinding ? `MRI: ${mriFinding}` : "",
          xrayFinding ? `X-ray: ${xrayFinding}` : "",
          observationForm.examinationFindings || "",
        ]
          .filter(Boolean)
          .join("\n");
        const existingObs =
          observations.find((o) => o.visitId === editingVisit.id) || null;
        try {
          if (
            observationForm.diagnosis ||
            combinedFindings ||
            observationForm.warningsAndPrecautions ||
            observationForm.treatmentPlan
          ) {
            const obsPayload: any = {
              diagnosis: observationForm.diagnosis || undefined,
              examinationFindings: combinedFindings || undefined,
              warningsAndPrecautions:
                observationForm.warningsAndPrecautions || undefined,
              treatmentPlan: observationForm.treatmentPlan || undefined,
              updatedAt: Date.now(),
            };
            if (existingObs) {
              await updateDoctorObservation(
                organizationId,
                existingObs.id,
                obsPayload,
              );
            } else {
              await createDoctorObservation(organizationId, {
                visitId: editingVisit.id,
                patientId: id!,
                doctorId: user!.uid,
                doctorName: user!.name || user!.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...obsPayload,
              } as any);
            }
          }
        } catch (e) {
          console.warn("Upsert diagnosis failed", e);
        }
        try {
          const existingPlan =
            exercisePlans.find((p) => p.visitId === editingVisit.id) || null;
          const trimmed = exerciseProtocol.trim();
          if (trimmed) {
            if (existingPlan) {
              // Shallow update: replace first exercise name
              const updated = {
                ...existingPlan,
                exercises: [...(existingPlan.exercises || [])],
              };
              if (updated.exercises.length)
                updated.exercises[0] = {
                  ...updated.exercises[0],
                  name: trimmed,
                };
              else
                updated.exercises = [
                  {
                    name: trimmed,
                    repetitions: "-",
                    sets: "-",
                    frequency: "-",
                    duration: "-",
                  },
                ];
              // Use createExercisePlan not suitable; we would need an updateExercisePlan, fallback by creating new entry
              await createExercisePlan(organizationId, {
                patientId: id!,
                patientName: patient!.fullName,
                visitId: editingVisit.id,
                exercises: updated.exercises,
                prescribedBy: user!.uid,
                prescribedByName: user!.name || user!.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              } as any);
            } else {
              await createExercisePlan(organizationId, {
                patientId: id!,
                patientName: patient!.fullName,
                visitId: editingVisit.id,
                exercises: [
                  {
                    name: trimmed,
                    repetitions: "-",
                    sets: "-",
                    frequency: "-",
                    duration: "-",
                  },
                ],
                prescribedBy: user!.uid,
                prescribedByName: user!.name || user!.email,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              } as any);
            }
          }
        } catch (e) {
          console.warn("Upsert exercise plan failed", e);
        }
        // Create a fresh CaseNote capturing the latest summary for Patients list
        try {
          // Keep only one latest CaseNote per patient: purge existing
          const existingNotes = await getPatientCaseNotes(organizationId, id!);
          await Promise.all(
            existingNotes.map((n) => deleteCaseNote(organizationId, n.id)),
          );
          await createCaseNote(organizationId, {
            patientId: id!,
            patientName: patient!.fullName,
            date: new Date(visitForm.visitDate).getTime(),
            complaint: visitForm.chiefComplaint || "",
            diagnosis: observationForm.diagnosis || "",
            mriFinding: mriFinding || "",
            xrayFinding: xrayFinding || "",
            precautions: observationForm.warningsAndPrecautions || "",
            rxPlan: observationForm.treatmentPlan || "",
            exerciseProtocol: exerciseProtocol || "",
            createdBy: user!.uid,
            createdByName: user!.name || user!.email,
            createdAt: Date.now(),
            updatedBy: user!.uid,
            updatedByName: user!.name || user!.email,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn("createCaseNote on edit failed", e);
        }
        toast({ title: "Updated", description: "Visit updated successfully" });
      } else {
        if (!id || !user || !patient || !organizationId) return;
        // 1) Create Visit
        const visitPayload: any = {
          patientId: id,
          patientName: patient.fullName,
          visitDate: new Date(visitForm.visitDate).getTime(),
          chiefComplaint: visitForm.chiefComplaint,
          attendingStaff: user.uid,
          attendingStaffName: user.name || user.email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        if (visitForm.painSeverity !== "")
          visitPayload.painSeverity = Number(visitForm.painSeverity);
        if (visitForm.visitNotes)
          visitPayload.visitNotes = visitForm.visitNotes;
        const visitId = await createVisit(organizationId, visitPayload);
        // 2) Create Observation (Diagnosis & Plan)
        const combinedFindings = [
          mriFinding ? `MRI: ${mriFinding}` : "",
          xrayFinding ? `X-ray: ${xrayFinding}` : "",
          observationForm.examinationFindings || "",
        ]
          .filter(Boolean)
          .join("\n");
        if (
          observationForm.diagnosis ||
          combinedFindings ||
          observationForm.warningsAndPrecautions ||
          observationForm.treatmentPlan
        ) {
          try {
            const obsPayload: any = {
              visitId,
              patientId: id,
              doctorId: user.uid,
              doctorName: user.name || user.email,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            if (observationForm.diagnosis)
              obsPayload.diagnosis = observationForm.diagnosis;
            if (combinedFindings)
              obsPayload.examinationFindings = combinedFindings;
            if (observationForm.warningsAndPrecautions)
              obsPayload.warningsAndPrecautions =
                observationForm.warningsAndPrecautions;
            if (observationForm.treatmentPlan)
              obsPayload.treatmentPlan = observationForm.treatmentPlan;
            await createDoctorObservation(organizationId, obsPayload);
          } catch (obsErr) {
            console.warn(
              "createDoctorObservation failed, visit created",
              obsErr,
            );
            toast({
              title: "Saved with warnings",
              description:
                "Visit saved, but diagnosis could not be saved due to permissions.",
              variant: "default",
            });
          }
        }
        // 3) Create Exercise Protocol (as a simple plan with one line)
        if (exerciseProtocol.trim()) {
          try {
            const planPayload: any = {
              patientId: id,
              patientName: patient.fullName,
              visitId,
              exercises: [
                {
                  name: exerciseProtocol.trim(),
                  repetitions: "-",
                  sets: "-",
                  frequency: "-",
                  duration: "-",
                },
              ],
              prescribedBy: user.uid,
              prescribedByName: user.name || user.email,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await createExercisePlan(organizationId, planPayload);
          } catch (planErr) {
            console.warn("createExercisePlan failed, visit created", planErr);
            toast({
              title: "Saved with warnings",
              description:
                "Visit saved, but exercise protocol could not be saved due to permissions.",
              variant: "default",
            });
          }
        }
        // 4) Create unified CaseNote for Patients list
        try {
          // Keep only one latest CaseNote per patient: purge existing
          const existingNotes = await getPatientCaseNotes(organizationId, id);
          await Promise.all(
            existingNotes.map((n) => deleteCaseNote(organizationId, n.id)),
          );
          await createCaseNote(organizationId, {
            patientId: id,
            patientName: patient.fullName,
            date: new Date(visitForm.visitDate).getTime(),
            complaint: visitForm.chiefComplaint || "",
            diagnosis: observationForm.diagnosis || "",
            mriFinding: mriFinding || "",
            xrayFinding: xrayFinding || "",
            precautions: observationForm.warningsAndPrecautions || "",
            rxPlan: observationForm.treatmentPlan || "",
            exerciseProtocol: exerciseProtocol || "",
            createdBy: user.uid,
            createdByName: user.name || user.email,
            createdAt: Date.now(),
            updatedBy: user.uid,
            updatedByName: user.name || user.email,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn("createCaseNote failed", e);
        }
        toast({ title: "Added", description: "Visit added successfully" });
      }
      setVisitDialogOpen(false);
      setEditingVisit(null);
      await loadPatientData();
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to save visit",
        variant: "destructive",
      });
    }
  };

  const removeVisit = async (visitId: string) => {
    if (!organizationId) return;
    try {
      await deleteVisit(organizationId, visitId);
      // After deletion, compute latest remaining summary and publish a CaseNote
      // Reload minimal data fresh to ensure we reflect backend state
      const remainingVisits = await getPatientVisits(organizationId, id!);
      const remainingObs = await getPatientDoctorObservations(
        organizationId,
        id!,
      );
      // Pick latest visit by visitDate
      let complaint = "";
      let diagnosis = "";
      let rxPlan = "";
      let dateTs = Date.now();
      if (remainingVisits.length) {
        const latestVisit = [...remainingVisits].sort(
          (a, b) => b.visitDate - a.visitDate,
        )[0];
        complaint = latestVisit.chiefComplaint || "";
        dateTs = latestVisit.visitDate;
        const obs =
          remainingObs.find((o) => o.visitId === latestVisit.id) || null;
        if (obs) {
          diagnosis = obs.diagnosis || "";
          rxPlan = obs.treatmentPlan || "";
        }
      }
      if (patient && user) {
        try {
          // Remove existing notes for patient so only latest remains
          const existingNotes = await getPatientCaseNotes(organizationId, id!);
          await Promise.all(
            existingNotes.map((n) => deleteCaseNote(organizationId, n.id)),
          );
          await createCaseNote(organizationId, {
            patientId: id!,
            patientName: patient.fullName,
            date: dateTs,
            complaint,
            diagnosis,
            rxPlan,
            createdBy: user.uid,
            createdByName: user.name || user.email,
            createdAt: Date.now(),
            updatedBy: user.uid,
            updatedByName: user.name || user.email,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.warn("createCaseNote after delete failed", e);
        }
      }
      await loadPatientData();
      toast({ title: "Deleted", description: "Visit deleted" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete visit",
        variant: "destructive",
      });
    }
  };

  // Observation edit/delete handlers
  const openEditObservation = (o: DoctorObservation) => {
    setEditingObservation(o);
    setObservationForm({
      diagnosis: o.diagnosis || "",
      examinationFindings: o.examinationFindings || "",
      warningsAndPrecautions: o.warningsAndPrecautions || "",
      treatmentPlan: o.treatmentPlan || "",
    });
    setObservationDialogOpen(true);
  };

  const saveObservation = async () => {
    if (!editingObservation || !organizationId) return;
    try {
      await updateDoctorObservation(organizationId, editingObservation.id, {
        diagnosis: observationForm.diagnosis || undefined,
        examinationFindings: observationForm.examinationFindings || undefined,
        warningsAndPrecautions:
          observationForm.warningsAndPrecautions || undefined,
        treatmentPlan: observationForm.treatmentPlan || undefined,
      });
      setObservationDialogOpen(false);
      setEditingObservation(null);
      await loadPatientData();
      toast({ title: "Updated", description: "Diagnosis & Plan updated" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to update diagnosis & plan",
        variant: "destructive",
      });
    }
  };

  const removeObservation = async (obsId: string) => {
    if (!organizationId) return;
    try {
      await deleteDoctorObservation(organizationId, obsId);
      await loadPatientData();
      toast({ title: "Deleted", description: "Diagnosis & Plan deleted" });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete diagnosis & plan",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!id || !organizationId) return;

    setDeleting(true);
    try {
      await deletePatient(organizationId, id);
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      navigate("/patients");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  if (loading || (!patient && !id)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold mb-4 text-muted-foreground">
          Patient not found
        </h2>
        <p className="text-muted-foreground mb-6">
          The patient record you are looking for might have been moved or
          deleted.
        </p>
        <Button onClick={() => navigate("/patients")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/patients")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {patient.fullName}
              {patientNumber && (
                <Badge variant="secondary" className="text-lg">
                  #{patientNumber}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Patient Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {canDeletePatient() && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Payment Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Payment Details</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={openEditPaymentDetails}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-slate-50 min-h-[60px]">
              {patient.attendancePaymentDetails || "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Paid Sessions</CardTitle>
            <div className="flex gap-1">
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={openRenewPaidDays}
                title="Renew Session"
              >
                <Plus className="w-4 h-4" />
              </Button> */}
              <Button
                variant="ghost"
                size="icon"
                onClick={openEditPaidDays}
                title="Edit Current"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border rounded-md p-3 bg-slate-50 min-h-[60px] space-y-2">
              {patient.paidDays ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-sky-700">
                      {currentSessionCount}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-xl font-semibold text-muted-foreground">
                      {patient.paidDays}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      days
                    </span>
                  </div>
                  {(() => {
                    const present = currentSessionCount;
                    const remaining = patient.paidDays - present;

                    if (remaining <= 0) {
                      return (
                        <Badge variant="destructive" className="animate-pulse">
                          Limit Reached!
                        </Badge>
                      );
                    } else if (remaining === 1) {
                      return (
                        <Badge className="bg-amber-500 hover:bg-amber-600">
                          1 Day Left!
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No session limit set
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {patient.paymentHistory && patient.paymentHistory.length > 0 && (
        <Accordion type="single" collapsible className="mb-8">
          <AccordionItem
            value="history"
            className="rounded-xl border bg-white shadow-sm"
          >
            <AccordionTrigger className="px-5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-600" />
                <span className="text-base font-semibold">Payment History</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-5 pb-5 space-y-3">
                {patient.paymentHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col p-3 border rounded-lg bg-slate-50 relative"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => setHistoryIndexToDelete(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="flex justify-between items-center mb-1 pr-10">
                      <span className="font-bold text-sky-800">
                        {getSessionName(idx)} ({item.days} Days Session)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(item.timestamp, "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                    {item.completedDates && (
                      <div className="text-xs text-muted-foreground">
                        Completed on: {item.completedDates.length} days recorded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Attendance Calendar */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            Attendance Calendar
            {(() => {
              if (patient.paidDays && currentSessionCount >= patient.paidDays) {
                return (
                  <Badge variant="destructive" className="ml-2">
                    Limit Reached
                  </Badge>
                );
              }
              return null;
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar
            attendance={patient.attendance || {}}
            archivedDates={(patient.paymentHistory || []).flatMap(
              (h) => h.completedDates || [],
            )}
            onAttendanceChange={handleAttendanceChange}
            isLocked={
              patient.paidDays !== undefined &&
              currentSessionCount >= patient.paidDays
            }
          />
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="space-y-6">
        <AccordionItem
          value="personal"
          className="rounded-xl border bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5">
            <div className="flex items-center justify-between w-full">
              <span className="text-base font-semibold">
                Personal Information
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{patient.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Age / Gender
                    </p>
                    <p className="font-medium">
                      {patient.age ? `${patient.age} years` : "N/A"}
                      {patient.gender && ` • ${patient.gender}`}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Medical History
                  </p>
                  <p className="text-sm">{patient.medicalHistory || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Complaint
                  </p>
                  <p className="text-sm">{patient.complaint || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Investigation
                  </p>
                  <p className="text-sm">{patient.investigation || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    My diagnosis
                  </p>
                  <p className="text-sm">{patient.diagnosis || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Precautions
                  </p>
                  <p className="text-sm">{patient.precautions || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Payment Details
                  </p>
                  <p className="text-sm font-mono whitespace-pre-wrap">
                    {patient.paymentDetails || "—"}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t space-y-1">
                <p className="text-xs text-muted-foreground">
                  Added by {patient.createdByName} on{" "}
                  {new Date(patient.createdAt).toLocaleDateString("en-GB")}
                </p>
                {patient.updatedByName && patient.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last updated by {patient.updatedByName} on{" "}
                    {new Date(patient.updatedAt).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="plan"
          className="rounded-xl border bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5">
            <span className="text-base font-semibold">Treatment Plan</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-5 pb-5 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Electro Therapy
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingElectroIndex(null);
                      setEditingElectroText("");
                      setEditElectroDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Electro
                  </Button>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto">
                  {(() => {
                    const nonEmptyElectros = (
                      patient.treatmentPlan?.electroTherapy || []
                    ).filter((electro) => electro.trim().length > 0);

                    return nonEmptyElectros.length ? (
                      nonEmptyElectros.map((electro, index) => (
                        <div key={index} className="relative">
                          <div className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-slate-50 pr-12">
                            {electro}
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEditElectro(index)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteElectro(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md bg-slate-50">
                        —
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Exercise Therapy
                  </h4>
                  <Button variant="outline" size="sm" onClick={openAddExercise}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>
                <div className="space-y-4 max-h-[350px] overflow-y-auto">
                  {(() => {
                    const nonEmptyExercises = (
                      patient.treatmentPlan?.exerciseTherapy || []
                    ).filter((exercise) => exercise.trim().length > 0);

                    return nonEmptyExercises.length ? (
                      nonEmptyExercises.map((exercise, index) => (
                        <div key={index} className="relative">
                          <div className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-slate-50 pr-12">
                            {exercise}
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEditExercise(index)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md bg-slate-50">
                        —
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Add Exercise Dialog */}
      <Dialog
        open={addExerciseDialogOpen}
        onOpenChange={setAddExerciseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Exercise Details</Label>
              <Textarea
                value={newExerciseText}
                onChange={(e) => setNewExerciseText(e.target.value)}
                placeholder="Enter exercise details..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddExerciseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveNewExercise}>Add Exercise</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Dialog */}
      <Dialog
        open={editExerciseDialogOpen}
        onOpenChange={setEditExerciseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Exercise Details</Label>
              <Textarea
                value={editingExerciseText}
                onChange={(e) => setEditingExerciseText(e.target.value)}
                placeholder="Enter exercise details..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditExerciseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedExercise}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Electro Dialog */}
      <Dialog
        open={editElectroDialogOpen}
        onOpenChange={setEditElectroDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingElectroIndex === null
                ? "Add Electro Therapy"
                : "Edit Electro Therapy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Electro Therapy Details</Label>
              <Textarea
                value={editingElectroText}
                onChange={(e) => setEditingElectroText(e.target.value)}
                placeholder="Enter electro therapy details..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditElectroDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={
                editingElectroIndex === null
                  ? async () => {
                      if (!patient || !id || !editingElectroText.trim()) return;
                      try {
                        const existingElectros =
                          patient.treatmentPlan?.electroTherapy || [];
                        const cleanedElectro = editingElectroText
                          .replace(/\n\s*\n/g, "\n")
                          .trim();
                        // Only add if not empty after cleaning
                        if (!cleanedElectro) return;
                        const newElectros = [
                          cleanedElectro,
                          ...existingElectros,
                        ];
                        await updatePatient(organizationId, id, {
                          treatmentPlan: {
                            ...(patient.treatmentPlan || {}),
                            electroTherapy: newElectros,
                          },
                        });
                        setPatient({
                          ...patient,
                          treatmentPlan: {
                            ...(patient.treatmentPlan || {}),
                            electroTherapy: newElectros,
                          },
                        });
                        setEditElectroDialogOpen(false);
                        setEditingElectroText("");
                        toast({
                          title: "Success",
                          description: "Electro therapy added successfully",
                        });
                      } catch (e) {
                        toast({
                          title: "Error",
                          description: "Failed to add electro therapy",
                          variant: "destructive",
                        });
                      }
                    }
                  : saveEditedElectro
              }
            >
              {editingElectroIndex === null ? "Add" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Details Dialog */}
      <Dialog
        open={editPaymentDetailsOpen}
        onOpenChange={setEditPaymentDetailsOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={paymentDetailsText}
                onChange={(e) => setPaymentDetailsText(e.target.value)}
                placeholder="Enter payment details..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPaymentDetailsOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={savePaymentDetails}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Paid Days Dialog */}
      <Dialog open={editPaidDaysOpen} onOpenChange={setEditPaidDaysOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRenewing ? "Renew Paid Sessions" : "Set Paid Session Limit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidDaysLimit">Number of Paid Days</Label>
              <Input
                id="paidDaysLimit"
                type="number"
                value={paidDaysValue}
                onChange={(e) => setPaidDaysValue(e.target.value)}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-muted-foreground italic">
                {isRenewing
                  ? "This will archive the current session and start a fresh one."
                  : "Set to 0 or leave blank to disable alerts for this patient."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPaidDaysOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={savePaidDays}>
              {isRenewing ? "Start New Session" : "Update Limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patient.fullName}'s record and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={historyIndexToDelete !== null}
        onOpenChange={(open) => !open && setHistoryIndexToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this payment record from the history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (historyIndexToDelete !== null) {
                  handleDeletePaymentHistory(historyIndexToDelete);
                  setHistoryIndexToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Visit Edit Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingVisit ? "Edit Visit" : "Add Visit"}
            </DialogTitle>
          </DialogHeader>
          <div
            className="grid gap-4 py-2 overflow-y-auto pr-2"
            style={{ maxHeight: "65vh" }}
          >
            <div className="grid gap-2">
              <Label htmlFor="vdate">Date</Label>
              <Input
                id="vdate"
                type="date"
                value={visitForm.visitDate}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, visitDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>📒 Complain</Label>
              <Input
                value={visitForm.chiefComplaint}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, chiefComplaint: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Pain Severity (0-10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={visitForm.painSeverity}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, painSeverity: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={visitForm.visitNotes}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, visitNotes: e.target.value })
                }
              />
            </div>
            <div className="pt-2 border-t" />
            <div className="grid gap-2">
              <Label>📝 My diagnosis</Label>
              <Textarea
                value={observationForm.diagnosis}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    diagnosis: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>▫️MRI Finding</Label>
              <Textarea
                value={mriFinding}
                onChange={(e) => setMriFinding(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>▫️ X-ray finding</Label>
              <Textarea
                value={xrayFinding}
                onChange={(e) => setXrayFinding(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>🛑 Precautions</Label>
              <Textarea
                value={observationForm.warningsAndPrecautions}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    warningsAndPrecautions: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>✳️ Rx plan</Label>
              <Textarea
                value={observationForm.treatmentPlan}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    treatmentPlan: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>❇️ Exercise protocol</Label>
              <Textarea
                value={exerciseProtocol}
                onChange={(e) => setExerciseProtocol(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveVisit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Observation Edit Dialog */}
      <Dialog
        open={observationDialogOpen}
        onOpenChange={setObservationDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Diagnosis & Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>My diagnosis</Label>
              <Textarea
                value={observationForm.diagnosis}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    diagnosis: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Findings</Label>
              <Textarea
                value={observationForm.examinationFindings}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    examinationFindings: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Precautions</Label>
              <Textarea
                value={observationForm.warningsAndPrecautions}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    warningsAndPrecautions: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Rx plan</Label>
              <Textarea
                value={observationForm.treatmentPlan}
                onChange={(e) =>
                  setObservationForm({
                    ...observationForm,
                    treatmentPlan: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setObservationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveObservation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Plan Edit Dialog */}
      <Dialog
        open={editTreatmentPlanOpen}
        onOpenChange={setEditTreatmentPlanOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Treatment Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Electro Therapy</Label>
              <Textarea
                placeholder="Enter electro therapy details..."
                className="min-h-[100px]"
                value={treatmentPlanForm.electroTherapy}
                onChange={(e) =>
                  setTreatmentPlanForm({
                    ...treatmentPlanForm,
                    electroTherapy: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Press Enter for new lines.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Exercise Therapy</Label>
              <Textarea
                placeholder="Enter exercise therapy details..."
                className="min-h-[150px]"
                value={treatmentPlanForm.exerciseTherapy}
                onChange={(e) =>
                  setTreatmentPlanForm({
                    ...treatmentPlanForm,
                    exerciseTherapy: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Press Enter for new lines.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTreatmentPlanOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveTreatmentPlan}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
