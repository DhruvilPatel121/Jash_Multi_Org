import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllPatients, getUser, subscribeToCaseNotes } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Patient, CaseNote, User } from "@/types";
import { ArrowLeft, Loader2, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

export default function DoctorPatientsPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const organizationId = organization?.id;
  const [doctor, setDoctor] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!doctorId || !organizationId) return;
        const [doc, allPatients] = await Promise.all([
          getUser(doctorId),
          getAllPatients(organizationId),
        ]);
        setDoctor(doc);
        setPatients(allPatients.filter((p) => p.assignedDoctorId === doctorId));
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    let unsubscribeNotes: (() => void) | null = null;
    if (organizationId) {
      unsubscribeNotes = subscribeToCaseNotes(organizationId, (notes) => {
        setCaseNotes(notes);
      });
    }

    return () => {
      if (unsubscribeNotes) {
        unsubscribeNotes();
      }
    };
  }, [doctorId, organizationId]);

  const latestCaseNoteByPatient = useMemo(() => {
    const map: Record<string, CaseNote> = {};
    for (const n of caseNotes) {
      if (!map[n.patientId]) map[n.patientId] = n;
    }
    return map;
  }, [caseNotes]);

  // Use the same numbering logic as PatientsPage (month-wise)
  const patientNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    const groups: Record<string, Patient[]> = {};

    patients.forEach((p) => {
      if (!p.createdAt) return;
      const key = format(new Date(p.createdAt), "MM-yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Doctor not found</h2>
        <Button onClick={() => navigate("/doctors")}>Back to Doctors</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/doctors")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Patients assigned to {doctor.name}</h1>
          <p className="text-muted-foreground mt-1">
            Total {patients.length} patients assigned
          </p>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white">
          <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patients assigned</h3>
          <p className="text-muted-foreground">This doctor doesn't have any assigned patients yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {patients.map((patient) => (
            <Card
              key={patient.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/patients/${patient.id}?num=${patientNumberMap.get(patient.id as string)}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-indigo-600 text-white font-semibold shadow-sm">
                        {patientNumberMap.get(patient.id as string)}
                      </div>
                      <CardTitle className="text-lg">{patient.fullName}</CardTitle>
                    </div>
                    {patient.age && (
                      <Badge variant="secondary" className="mt-2">
                        {patient.age} years
                      </Badge>
                    )}
                  </div>
                  {patient.gender && (
                    <Badge variant="outline">{patient.gender}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const note = latestCaseNoteByPatient[patient.id];
                  return (
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium text-sky-700">Complaint:</span>{" "}
                        <span className="text-muted-foreground line-clamp-2">
                          {note?.complaint || patient.complaint || "—"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-sky-700">Diagnosis:</span>{" "}
                        <span className="text-muted-foreground line-clamp-2">
                          {note?.diagnosis || patient.diagnosis || "—"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className="text-xs text-muted-foreground mt-2">
                  Updated on {new Date(patient.updatedAt || patient.createdAt).toLocaleDateString("en-GB")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
