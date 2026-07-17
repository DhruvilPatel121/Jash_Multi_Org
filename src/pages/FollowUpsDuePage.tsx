import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFollowUpsDue } from '@/services/firebase';
import type { Visit } from '@/types';
import { Clock, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function FollowUpsDuePage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { organization } = useAuth();
  const organizationId = organization?.id;

  useEffect(() => {
    if (organizationId) {
      loadFollowUps();
    }
  }, [organizationId]);

  const loadFollowUps = async () => {
    if (!organizationId) return;
    try {
      const data = await getFollowUpsDue(organizationId);
      setVisits(data);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
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
          <h1 className="text-3xl font-bold">Follow-ups Due</h1>
          <p className="text-muted-foreground mt-1">Visits from 7-30 days ago that may need follow-up</p>
        </div>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No follow-ups due at this time</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {visits.map((visit) => (
            <Card 
              key={visit.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/patients/${visit.patientId}/visits/${visit.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{visit.patientName}</CardTitle>
                  <Badge variant="outline">
                    {new Date(visit.visitDate).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Chief Complaint</p>
                  <p className="font-medium">{visit.chiefComplaint}</p>
                </div>
                {visit.painSeverity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pain Severity</p>
                    <p className="font-medium">{visit.painSeverity}/10</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Attended by {visit.attendingStaffName} on {new Date(visit.visitDate).toLocaleDateString()}
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

