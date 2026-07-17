import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPendingPrescriptions } from '@/services/firebase';
import type { Prescription } from '@/types';
import { FileText, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { organization } = useAuth();
  const organizationId = organization?.id;

  useEffect(() => {
    if (organizationId) {
      loadPrescriptions();
    }
  }, [organizationId]);

  const loadPrescriptions = async () => {
    if (!organizationId) return;
    try {
      const data = await getPendingPrescriptions(organizationId);
      setPrescriptions(data);
    } catch (error) {
      console.error('Error loading pending prescriptions:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Pending Prescriptions</h1>
          <p className="text-muted-foreground mt-1">Recent prescriptions (last 7 days) that may need review</p>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending prescriptions</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {prescriptions.map((prescription) => (
            <Card 
              key={prescription.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/patients/${prescription.patientId}/visits/${prescription.visitId}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{prescription.patientName}</CardTitle>
                  <Badge variant="outline">
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Medicines</p>
                  {prescription.medicines.map((medicine, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-3 mb-2">
                      <p className="font-semibold">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Prescribed by {prescription.prescribedByName} on {new Date(prescription.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

