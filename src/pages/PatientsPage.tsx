import { useEffect, useMemo, useState, memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PatientDateCalendar } from "@/components/patients/PatientDateCalendar";
import { subscribeToPatients, subscribeToCaseNotes } from "@/services/firebase";
import type { Patient, CaseNote } from "@/types";
import {
  Search,
  Plus,
  User,
  Loader2,
  Download,
  Calendar as CalendarIcon,
  Activity,
  ChevronUp,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { highlightText } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function patientMatchesDate(patient: Patient, targetDateStr: string) {
  if (!patient.id) return false;

  const isCreatedOnDate =
    !!patient.createdAt &&
    format(new Date(patient.createdAt), "yyyy-MM-dd") === targetDateStr;

  const hasPresentOnDate = patient.attendance?.[targetDateStr] === "present";

  return isCreatedOnDate || hasPresentOnDate;
}

// Memoized patient card component to prevent unnecessary re-renders
const PatientCard = memo(function PatientCard({
  patient,
  patientNumber,
  latestCaseNote,
  debouncedSearch,
  selectedDate,
  onClick,
}: {
  patient: Patient;
  patientNumber: number;
  latestCaseNote?: CaseNote;
  debouncedSearch: string;
  selectedDate?: Date;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 text-white font-semibold shadow-sm">
                {patientNumber}
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-lg">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: highlightText(patient.fullName, debouncedSearch),
                    }}
                  />
                </CardTitle>
                {patient.createdAt && (
                  <span className="text-xs text-muted-foreground font-normal">
                    Created: {format(new Date(patient.createdAt), "dd/MM/yyyy")}
                  </span>
                )}
                {selectedDate &&
                  (() => {
                    const targetDateStr = format(selectedDate, "yyyy-MM-dd");
                    const isCreatedOnDate =
                      !!patient.createdAt &&
                      format(new Date(patient.createdAt), "yyyy-MM-dd") ===
                        targetDateStr;
                    const hasVisitedOnDate =
                      patient.attendance?.[targetDateStr] === "present" ||
                      patient.attendance?.[targetDateStr] === "absent";

                    return (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {isCreatedOnDate && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            New Patient
                          </span>
                        )}
                        {hasVisitedOnDate && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Visited
                          </span>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </div>
            {patient.age && (
              <Badge variant="secondary" className="mt-2">
                {patient.age} years
              </Badge>
            )}
          </div>
          {patient.gender && <Badge variant="outline">{patient.gender}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium text-sky-700">Complaint:</span>{" "}
            <span
              className="text-muted-foreground line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: highlightText(
                  latestCaseNote?.complaint || patient.complaint || "—",
                  debouncedSearch,
                ),
              }}
            />
          </div>
          <div className="text-sm">
            <span className="font-medium text-sky-700">Diagnosis:</span>{" "}
            <span
              className="text-muted-foreground line-clamp-2"
              dangerouslySetInnerHTML={{
                __html: highlightText(
                  latestCaseNote?.diagnosis || patient.diagnosis || "—",
                  debouncedSearch,
                ),
              }}
            />
          </div>
          <div className="text-sm">
            <span className="font-medium text-sky-700">Rx plan:</span>{" "}
            <span className="text-muted-foreground line-clamp-2">{"—"}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Updated on{" "}
          {new Date(patient.updatedAt || patient.createdAt).toLocaleDateString(
            "en-GB",
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "MM"),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    format(new Date(), "yyyy"),
  );
  const [treatmentFilter, setTreatmentFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);
  const scrollRestorationRef = useRef(false);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { organization } = useAuth();
  const organizationId = organization?.id;

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const treatmentStatuses = [
    { value: "all", label: "All Status" },
    { value: "taken", label: "Taken Treatment" },
    { value: "not_taken", label: "Not Taken Treatment" },
  ];

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedMonth(format(new Date(), "MM"));
    setSelectedYear(format(new Date(), "yyyy"));
    setTreatmentFilter("all");
    setSelectedDate(undefined);
  }, []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const patientYears = patients.map((p) =>
      p.createdAt ? new Date(p.createdAt).getFullYear() : currentYear,
    );
    const minYear = Math.min(...patientYears, currentYear - 1);
    const maxYear = Math.max(...patientYears, currentYear);

    const result = [];
    for (let i = maxYear; i >= minYear; i--) {
      result.push(i.toString());
    }
    return result;
  }, [patients]);

  const loadJsPDF = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // If already loaded
      // @ts-ignore
      if (window.jspdf && window.jspdf.jsPDF)
        return resolve(window.jspdf.jsPDF);
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error("jsPDF failed to load"));
      };
      script.onerror = () => reject(new Error("Failed to load jsPDF"));
      document.body.appendChild(script);
    });
  };

  const exportPatientsPdf = async () => {
    const jsPDF = await loadJsPDF();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 36; // 0.5 inch
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Patient Records Export", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 20;
    const dateStr = `${new Date().toLocaleDateString(
      "en-GB",
    )} ${new Date().toLocaleTimeString()}`;
    doc.setTextColor(100);
    doc.text(
      `Generated on ${dateStr} • Total Patients: ${filteredPatients.length}`,
      margin,
      y,
    );
    doc.setTextColor(0);
    y += 30;

    filteredPatients.forEach((patient, index) => {
      // Check if we need a new page
      if (y + 200 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      // Patient header
      doc.setFillColor(59, 130, 246); // Blue background
      doc.rect(margin, y - 15, pageWidth - margin * 2, 25, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const patientNum =
        patientNumberMap.get(patient.id as string) || index + 1;
      const patientMonth = patient.createdAt
        ? format(new Date(patient.createdAt), "MMM yy")
        : "";
      doc.text(
        `${patientNum}. ${patient.fullName} (${patientMonth})`,
        margin + 5,
        y,
      );

      // Add patient ID for reference
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`ID: ${patient.id}`, pageWidth - margin - 80, y);

      doc.setTextColor(0, 0, 0);
      y += 35;

      // Basic Information Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Basic Information:", margin, y);
      y += 15;

      doc.setFont("helvetica", "normal");
      const basicInfo = [
        `Phone: ${patient.phoneNumber || "N/A"}`,
        `Email: ${patient.email || "N/A"}`,
        `Age: ${patient.age || "N/A"} ${
          patient.dateOfBirth ? `(${patient.dateOfBirth})` : ""
        }`,
        `Gender: ${patient.gender || "N/A"}`,
        `Address: ${patient.address || "N/A"}`,
        `Emergency Contact: ${patient.emergencyContact || "N/A"}`,
      ];

      basicInfo.forEach((info) => {
        if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(info, margin + 10, y);
        y += 12;
      });

      // Medical Information Section
      if (patient.medicalHistory || patient.currentMedications) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Medical Information:", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");

        if (patient.medicalHistory) {
          doc.text("Medical History:", margin + 10, y);
          y += 12;
          const historyLines = doc.splitTextToSize(
            patient.medicalHistory,
            pageWidth - margin * 2 - 20,
          );
          historyLines.forEach((line: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 15, y);
            y += 12;
          });
        }

        if (patient.currentMedications) {
          y += 5;
          doc.text("Current Medications:", margin + 10, y);
          y += 12;
          const medLines = doc.splitTextToSize(
            patient.currentMedications,
            pageWidth - margin * 2 - 20,
          );
          medLines.forEach((line: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 15, y);
            y += 12;
          });
        }
      }

      // Clinical Information Section
      if (
        patient.complaint ||
        patient.diagnosis ||
        patient.investigation ||
        patient.precautions
      ) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Clinical Information:", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");

        const clinicalInfo = [
          { label: "Chief Complaint:", value: patient.complaint },
          { label: "Diagnosis:", value: patient.diagnosis },
          { label: "Investigation:", value: patient.investigation },
          { label: "Precautions:", value: patient.precautions },
        ];

        clinicalInfo.forEach((info) => {
          if (info.value) {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.text(info.label, margin + 10, y);
            y += 12;
            doc.setFont("helvetica", "normal");
            const valueLines = doc.splitTextToSize(
              info.value,
              pageWidth - margin * 2 - 25,
            );
            valueLines.forEach((line: string) => {
              if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin + 15, y);
              y += 12;
            });
            y += 5;
          }
        });
      }

      // Treatment Plan Section
      if (patient.treatmentPlan) {
        y += 5;
        doc.setFont("helvetica", "bold");
        doc.text("Treatment Plan:", margin, y);
        y += 15;
        doc.setFont("helvetica", "normal");

        if (
          patient.treatmentPlan.electroTherapy &&
          patient.treatmentPlan.electroTherapy.length > 0
        ) {
          doc.text("Electrotherapy:", margin + 10, y);
          y += 12;
          patient.treatmentPlan.electroTherapy.forEach((therapy: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(`• ${therapy}`, margin + 15, y);
            y += 12;
          });
        }

        if (
          patient.treatmentPlan.exerciseTherapy &&
          patient.treatmentPlan.exerciseTherapy.length > 0
        ) {
          y += 5;
          doc.text("Exercise Therapy:", margin + 10, y);
          y += 12;
          patient.treatmentPlan.exerciseTherapy.forEach((therapy: string) => {
            if (y + 12 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(`• ${therapy}`, margin + 15, y);
            y += 12;
          });
        }
      }

      // Record Information
      y += 10;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100);
      const recordInfo = `Created by: ${
        patient.createdByName || "Unknown"
      } on ${new Date(patient.createdAt).toLocaleDateString("en-GB")}`;
      doc.text(recordInfo, margin, y);
      if (patient.updatedBy && patient.updatedAt !== patient.createdAt) {
        y += 10;
        const updateInfo = `Last updated by: ${
          patient.updatedByName || "Unknown"
        } on ${new Date(patient.updatedAt).toLocaleDateString("en-GB")}`;
        doc.text(updateInfo, margin, y);
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      y += 25; // Space between patients
    });

    doc.save(`patients_complete_${new Date().getTime()}.pdf`);
  };

  useEffect(() => {
    console.log(
      "PatientsPage useEffect running with organizationId:",
      organizationId,
    );
    if (!organizationId) {
      console.log(
        "PatientsPage: no organizationId found, setting loading to false",
      );
      setLoading(false);
      return;
    }

    // Subscribe to real-time patient updates
    console.log("PatientsPage: subscribing to patients");
    const unsubscribePatients = subscribeToPatients(
      organizationId,
      (updatedPatients) => {
        console.log(
          "PatientsPage: received patients from subscribe:",
          updatedPatients,
        );
        setPatients(updatedPatients);
        setLoading(false);
      },
    );
    // Subscribe to real-time case notes so cards refresh instantly
    const unsubscribeNotes = subscribeToCaseNotes(organizationId, (notes) => {
      console.log("PatientsPage: received case notes from subscribe:", notes);
      setCaseNotes(notes);
    });

    // Handle scroll events for scroll to top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      console.log("PatientsPage: cleaning up subscriptions");
      unsubscribePatients();
      unsubscribeNotes();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [organizationId]);

  // Restore filter state from sessionStorage if available
  useEffect(() => {
    const savedFilterState = sessionStorage.getItem("patients_filter_state");
    if (savedFilterState) {
      try {
        const filterState = JSON.parse(savedFilterState);
        setSearchTerm(filterState.searchTerm || "");
        setSelectedMonth(filterState.selectedMonth || format(new Date(), "MM"));
        setSelectedYear(filterState.selectedYear || format(new Date(), "yyyy"));
        setTreatmentFilter(filterState.treatmentFilter || "all");
        setSelectedDate(
          filterState.selectedDate
            ? new Date(filterState.selectedDate)
            : undefined,
        );
        // Clear after restoring
        sessionStorage.removeItem("patients_filter_state");
      } catch (e) {
        console.error("Failed to restore filter state", e);
      }
    }
  }, []);

  // Restore scroll position after data and filters are loaded
  useEffect(() => {
    if (
      !loading &&
      !scrollRestorationRef.current &&
      filteredPatients.length > 0
    ) {
      const savedScrollPos = sessionStorage.getItem("patients_scroll_pos");
      if (savedScrollPos) {
        // Wait for both data and filters to be applied, then restore scroll
        // Increased delay to ensure filtered grid is fully rendered
        setTimeout(() => {
          requestAnimationFrame(() => {
            const scrollPosition = parseInt(savedScrollPos, 10);
            window.scrollTo({
              top: scrollPosition,
              behavior: "instant",
            });
            sessionStorage.removeItem("patients_scroll_pos");
            scrollRestorationRef.current = true;
            setScrollRestored(true);
          });
        }, 1000);
      } else {
        scrollRestorationRef.current = true;
        setScrollRestored(true);
      }
    }
  }, [loading, filteredPatients.length]);

  // Build latest case note by patientId
  const latestCaseNoteByPatient = useMemo(() => {
    const map: Record<string, CaseNote> = {};
    for (const n of caseNotes) {
      if (!map[n.patientId]) map[n.patientId] = n;
    }
    return map;
  }, [caseNotes]);

  // Calculate total patients per date (new registrations + present visits only)
  const totalPatientsPerDate = useMemo(() => {
    const counts: Record<string, Set<string>> = {};

    patients.forEach((patient) => {
      if (!patient.id) return;

      if (patient.createdAt) {
        const createdDateStr = format(
          new Date(patient.createdAt),
          "yyyy-MM-dd",
        );
        if (!counts[createdDateStr]) counts[createdDateStr] = new Set();
        counts[createdDateStr].add(patient.id);
      }

      if (patient.attendance) {
        Object.entries(patient.attendance).forEach(([dateStr, status]) => {
          if (status !== "present") return;
          if (!counts[dateStr]) counts[dateStr] = new Set();
          counts[dateStr].add(patient.id);
        });
      }
    });

    const finalCounts: Record<string, number> = {};
    Object.keys(counts).forEach((dateStr) => {
      finalCounts[dateStr] = counts[dateStr].size;
    });

    return finalCounts;
  }, [patients]);

  // Calculate month-wise numbering for ALL patients to ensure consistency across search and filter
  const patientNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    // Group patients by month-year
    const groups: Record<string, Patient[]> = {};

    patients.forEach((p) => {
      if (!p.createdAt) return;
      const key = format(new Date(p.createdAt), "MM-yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    // Sort each group and assign numbers
    Object.values(groups).forEach((group) => {
      const sorted = [...group].sort((a, b) => {
        const ac = a.createdAt || 0;
        const bc = b.createdAt || 0;
        if (ac !== bc) return ac - bc;
        return (a.id || "").localeCompare(b.id || "");
      });
      sorted.forEach((p, idx) => {
        map.set(p.id as string, idx + 1);
      });
    });

    return map;
  }, [patients]);

  useEffect(() => {
    let result = [...patients];

    // 1. Apply SEARCH filter first if present (GLOBAL search)
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase().trim();
      result = result.filter((patient) => {
        const nameMatch =
          patient.fullName?.toLowerCase().includes(term) || false;
        const phoneMatch =
          patient.phoneNumber?.includes(debouncedSearch) || false;
        const emailMatch = patient.email?.toLowerCase().includes(term) || false;
        const addressMatch =
          patient.address?.toLowerCase().includes(term) || false;
        const emergencyMatch =
          patient.emergencyContact?.toLowerCase().includes(term) || false;

        // Clinical fields on the patient record
        const clinicalMatch = [
          patient.diagnosis,
          patient.complaint,
          patient.investigation,
          patient.precautions,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);

        // Search in latest case notes if available
        const note = latestCaseNoteByPatient[patient.id];
        let caseNoteMatch = false;
        if (note) {
          const combined = [
            note.complaint,
            note.diagnosis,
            note.mriFinding,
            note.xrayFinding,
            note.precautions,
            note.rxPlan,
            note.exerciseProtocol,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          caseNoteMatch = combined.includes(term);
        }

        return (
          nameMatch ||
          phoneMatch ||
          emailMatch ||
          addressMatch ||
          emergencyMatch ||
          clinicalMatch ||
          caseNoteMatch
        );
      });
    } else {
      // 2. Apply DATE FILTER if present
      if (selectedDate) {
        const targetDateStr = format(selectedDate, "yyyy-MM-dd");
        result = result.filter((patient) =>
          patientMatchesDate(patient, targetDateStr),
        );
      } else {
        // 3. Apply MONTH/YEAR filter if no date and no search
        result = result.filter((patient) => {
          if (!patient.createdAt) return false;
          const createdAt = new Date(patient.createdAt);
          return (
            format(createdAt, "MM") === selectedMonth &&
            format(createdAt, "yyyy") === selectedYear
          );
        });
      }
    }

    // 4. Apply TREATMENT STATUS filter
    if (treatmentFilter !== "all") {
      result = result.filter((patient) => {
        const hasAttendance =
          patient.attendance && Object.keys(patient.attendance).length > 0;
        return treatmentFilter === "taken" ? hasAttendance : !hasAttendance;
      });
    }

    setFilteredPatients(result);
  }, [
    debouncedSearch,
    patients,
    latestCaseNoteByPatient,
    selectedMonth,
    selectedYear,
    treatmentFilter,
    selectedDate,
  ]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <Card>
          <CardHeader className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
              <div className="h-10 w-32 bg-muted animate-pulse rounded" />
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-48 bg-muted animate-pulse rounded" />
              <div className="h-10 w-40 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePatientClick = (patientId: string) => {
    // Save scroll position before navigating
    sessionStorage.setItem("patients_scroll_pos", window.scrollY.toString());
    // Save filter state before navigating
    const filterState = {
      searchTerm,
      selectedMonth,
      selectedYear,
      treatmentFilter,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
    };
    sessionStorage.setItem(
      "patients_filter_state",
      JSON.stringify(filterState),
    );
    navigate(`/patients/${patientId}?num=${patientNumberMap.get(patientId)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold sm:gap-3 sm:text-3xl">
            Patients
            {selectedDate && (
              <Badge
                variant="outline"
                className="bg-emerald-50 border-emerald-200 px-2 py-0.5 text-sm text-emerald-700 sm:px-3 sm:py-1 sm:text-base"
              >
                {format(selectedDate, "MMM d, yyyy")}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-sm sm:px-3 sm:py-1 sm:text-base"
            >
              {selectedDate
                ? `${filteredPatients.length} patients`
                : `Total: ${patients.length}`}
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {selectedDate
              ? "New patients and visits on this date"
              : "Manage patient records"}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
          <Button
            variant="outline"
            onClick={exportPatientsPdf}
            className="flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => navigate("/patients/new")}
            className="flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, diagnosis, Rx plan, findings, or exercise protocol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center">
            <div className="min-w-0 lg:w-[140px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <div className="flex min-w-0 items-center gap-2">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Month" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 lg:w-[100px]">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 min-w-0 lg:min-w-[220px] lg:flex-1 lg:max-w-sm xl:max-w-md">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto min-h-9 w-full min-w-0 justify-start whitespace-normal px-3 py-2 text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selectedDate ? (
                      <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                        <span className="min-w-0 truncate text-sm leading-tight">
                          <span className="sm:hidden">
                            {format(selectedDate, "dd MMM yyyy")}
                          </span>
                          <span className="hidden sm:inline">
                            {format(selectedDate, "MMM d, yyyy")}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold leading-none text-emerald-700 sm:text-xs">
                          {totalPatientsPerDate[
                            format(selectedDate, "yyyy-MM-dd")
                          ] ?? 0}
                        </span>
                      </span>
                    ) : (
                      <span className="truncate text-sm">Pick date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto max-w-[calc(100vw-2rem)] p-4"
                  align="start"
                >
                  <PatientDateCalendar
                    selected={selectedDate}
                    patientCounts={totalPatientsPerDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setSelectedMonth(format(date, "MM"));
                        setSelectedYear(format(date, "yyyy"));
                      }
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-2 min-w-0 sm:col-span-1 lg:w-[180px]">
              <Select
                value={treatmentFilter}
                onValueChange={setTreatmentFilter}
              >
                <SelectTrigger className="w-full">
                  <div className="flex min-w-0 items-center gap-2">
                    <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Treatment Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {treatmentStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchTerm ||
              treatmentFilter !== "all" ||
              selectedMonth !== format(new Date(), "MM") ||
              selectedYear !== format(new Date(), "yyyy") ||
              selectedDate) && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="col-span-2 w-full text-muted-foreground sm:col-span-1 sm:w-auto lg:w-auto"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedDate
                  ? "No patients on this date"
                  : "No patients found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try a different search term"
                  : selectedDate
                    ? "Select another date to view patients"
                    : "Get started by adding your first patient"}
              </p>
              {!searchTerm && !selectedDate && (
                <Button onClick={() => navigate("/patients/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  patientNumber={
                    patientNumberMap.get(patient.id as string) || 0
                  }
                  latestCaseNote={latestCaseNoteByPatient[patient.id]}
                  debouncedSearch={debouncedSearch}
                  selectedDate={selectedDate}
                  onClick={() => handlePatientClick(patient.id as string)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg"
          size="icon"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
