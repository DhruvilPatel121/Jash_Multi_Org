import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAllDoctors, getAllPatients, deleteUser } from "@/services/firebase";
import { registerDoctorByAdmin } from "@/services/admin-actions";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import type { User, Patient } from "@/types";
import {
  User as UserIcon,
  Loader2,
  ArrowLeft,
  Users,
  Plus,
  Trash2,
} from "lucide-react";

export default function DoctorsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageDoctors } = usePermissions();
  const { organization } = useAuth();
  const organizationId = organization?.id;

  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Add doctor dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adding, setAdding] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Delete doctor dialog
  const [doctorToDelete, setDoctorToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  const loadData = async () => {
    if (!organizationId) return;
    try {
      const [allDoctors, allPatients] = await Promise.all([
        getAllDoctors(organizationId),
        getAllPatients(organizationId),
      ]);
      setDoctors(allDoctors);
      setPatients(allPatients);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name || !doctorForm.email || !doctorForm.password) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      if (!organizationId) return;
      const { error } = await registerDoctorByAdmin(
        organizationId,
        doctorForm.name,
        doctorForm.email,
        doctorForm.password,
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Doctor registered successfully",
      });
      setShowAddDialog(false);
      setDoctorForm({ name: "", email: "", password: "" });
      loadData(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register doctor",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete || !organizationId) return;

    setDeleting(true);
    try {
      // Note: This only deletes from Database.
      // Deleting from Auth requires Admin SDK or user being logged in.
      // For this app, deleting from DB is enough to hide them.
      await deleteUser(doctorToDelete.uid);
      toast({
        title: "Success",
        description: "Doctor removed from list",
      });
      setDoctorToDelete(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove doctor",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getPatientCount = (doctorId: string) => {
    return patients.filter((p) => p.assignedDoctorId === doctorId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Doctors List</h1>
            <p className="text-muted-foreground mt-1">
              View all doctors and their assigned patients
            </p>
          </div>
        </div>
        {canManageDoctors() && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Doctor
          </Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.uid} className="relative group">
            <div
              className="cursor-pointer transition-all"
              onClick={() => navigate(`/doctors/${doctor.uid}/patients`)}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {doctor.role}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{getPatientCount(doctor.uid)} Patients Assigned</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 truncate">
                  {doctor.email}
                </p>
              </CardContent>
            </div>
            {canManageDoctors() && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setDoctorToDelete(doctor);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Add Doctor Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(isOpen) => {
          setShowAddDialog(isOpen);
          if (!isOpen) {
            // Reset form when dialog is closed
            setDoctorForm({ name: "", email: "", password: "" });
            setAdding(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Doctor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Dr. Dhruvil Bhuva"
                value={doctorForm.name}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="dhruvil.unofficial@gmail.com"
                value={doctorForm.email}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Login Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={doctorForm.password}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, password: e.target.value })
                }
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Doctor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!doctorToDelete}
        onOpenChange={(open) => !open && setDoctorToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{doctorToDelete?.name}</strong> from the
              doctor list and the patient assignment dropdown.
              <br />
              <br />
              <em>
                Note: This does not delete their patients or their login
                credentials, only their presence in the active doctor list.
              </em>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteDoctor}
              disabled={deleting}
            >
              {deleting ? "Removing..." : "Remove Doctor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
