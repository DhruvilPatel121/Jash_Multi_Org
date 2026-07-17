import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, UserRound } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Quick actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => navigate('/patients/new')}
            className="p-4 border rounded-lg hover:bg-sky-50 transition-colors text-left"
          >
            <Users className="w-6 h-6 text-sky-600 mb-2" />
            <h3 className="font-semibold">Add New Patient</h3>
            <p className="text-sm text-muted-foreground">Register a new patient</p>
          </button>
          <button
            onClick={() => navigate('/patients')}
            className="p-4 border rounded-lg hover:bg-sky-50 transition-colors text-left"
          >
            <Calendar className="w-6 h-6 text-sky-600 mb-2" />
            <h3 className="font-semibold">View Patients</h3>
            <p className="text-sm text-muted-foreground">Browse all patients</p>
          </button>
          <button
            onClick={() => navigate('/doctors')}
            className="p-4 border rounded-lg hover:bg-sky-50 transition-colors text-left"
          >
            <UserRound className="w-6 h-6 text-sky-600 mb-2" />
            <h3 className="font-semibold">Doctors List</h3>
            <p className="text-sm text-muted-foreground">View all doctors and their patients</p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
