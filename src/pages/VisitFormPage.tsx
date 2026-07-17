import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { createVisit, getPatient } from '@/services/firebase';
import type { Patient } from '@/types';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function VisitFormPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const organizationId = organization?.id;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    durationOfProblem: '',
    previousTreatment: '',
    painSeverity: 5,
    visitNotes: ''
  });

  useEffect(() => {
    if (patientId && organizationId) {
      loadPatient();
    }
  }, [patientId, organizationId]);

  const loadPatient = async () => {
    if (!organizationId) return;
    try {
      const patientData = await getPatient(organizationId, patientId!);
      setPatient(patientData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patient data',
        variant: 'destructive'
      });
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chiefComplaint) {
      toast({
        title: 'Error',
        description: 'Please enter the chief complaint',
        variant: 'destructive'
      });
      return;
    }

    if (!user || !patient || !organizationId) return;

    setLoading(true);

    try {
      await createVisit(organizationId, {
        patientId: patientId!,
        patientName: patient.fullName,
        visitDate: new Date(formData.visitDate).getTime(),
        chiefComplaint: formData.chiefComplaint,
        durationOfProblem: formData.durationOfProblem,
        previousTreatment: formData.previousTreatment,
        painSeverity: formData.painSeverity,
        attendingStaff: user.uid,
        attendingStaffName: user.name,
        visitNotes: formData.visitNotes,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      toast({
        title: 'Success',
        description: 'Visit recorded successfully'
      });
      navigate(`/patients/${patientId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record visit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Patient not found</h2>
        <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${patientId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add Visit</h1>
          <p className="text-muted-foreground mt-1">Record visit for {patient.fullName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="visitDate">Visit Date *</Label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint / Injury Description *</Label>
              <Textarea
                id="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                rows={3}
                required
                placeholder="Describe the main complaint or injury"
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="durationOfProblem">Duration of Problem</Label>
                <Input
                  id="durationOfProblem"
                  value={formData.durationOfProblem}
                  onChange={(e) => setFormData({ ...formData, durationOfProblem: e.target.value })}
                  placeholder="e.g., 2 weeks, 3 months"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previousTreatment">Previous Treatment</Label>
                <Input
                  id="previousTreatment"
                  value={formData.previousTreatment}
                  onChange={(e) => setFormData({ ...formData, previousTreatment: e.target.value })}
                  placeholder="Any previous treatments"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Pain Severity (1-10)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[formData.painSeverity]}
                  onValueChange={(value) => setFormData({ ...formData, painSeverity: value[0] })}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <div className="w-12 text-center font-bold text-lg">
                  {formData.painSeverity}
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitNotes">Visit Notes</Label>
              <Textarea
                id="visitNotes"
                value={formData.visitNotes}
                onChange={(e) => setFormData({ ...formData, visitNotes: e.target.value })}
                rows={4}
                placeholder="Additional notes about the visit"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate(`/patients/${patientId}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Visit
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
