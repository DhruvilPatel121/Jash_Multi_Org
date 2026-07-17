import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Search } from "lucide-react";
import { getAllOrganizations } from "@/services/firebase";
import type { Organization } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function OrganizationSelectionPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, switchOrganization } = useAuth();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (org: Organization) => {
    if (user) {
      await switchOrganization(org.id);
      navigate("/dashboard");
    } else {
      // If no user is logged in, maybe redirect to login?
      navigate("/login");
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-sky-600" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Organization
          </h1>
          <p className="text-gray-600">
            Choose an organization to continue or create a new one
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSelectOrganization(org)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {org.email || org.phone || "No contact info"}
                  </p>
                </CardContent>
              </Card>
            ))}

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-dashed"
              onClick={() => navigate("/create-organization")}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Set up a new organization for your clinic
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
