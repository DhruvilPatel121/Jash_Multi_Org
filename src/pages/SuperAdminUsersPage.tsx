import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowLeft, Plus } from "lucide-react";
import { getAllOrganizations, getAllUsers } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Organization, User, UserRole } from "@/types";

export default function SuperAdminUsersPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "superadmin">>("admin");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();
  const { user, createUserAsSuperAdmin } = useAuth();
  const { toast } = useToast();

  // Check if current user is super admin
  useEffect(() => {
    if (user && user.role !== "superadmin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Load organizations
  useEffect(() => {
    async function loadData() {
      try {
        const orgs = await getAllOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error("Error loading organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [toast]);

  // Load users for selected organization
  useEffect(() => {
    async function loadUsers() {
      if (!selectedOrgId) {
        setUsers([]);
        return;
      }
      try {
        const allUsers = await getAllUsers();
        const orgUsers = allUsers.filter((u) => u.organizationId === selectedOrgId);
        setUsers(orgUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    }
    loadUsers();
  }, [selectedOrgId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) {
      toast({
        title: "Error",
        description: "Please select an organization first",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await createUserAsSuperAdmin(email, password, name, role, selectedOrgId);
      if (error) throw error;

      // Refresh user list
      const allUsers = await getAllUsers();
      const orgUsers = allUsers.filter((u) => u.organizationId === selectedOrgId);
      setUsers(orgUsers);

      // Reset form
      setName("");
      setEmail("");
      setPassword("");

      toast({
        title: "User Created",
        description: "User has been created successfully",
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Create New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="organization">Select Organization *</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={role}
                    onValueChange={(value: any) => setRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Users in{" "}
                {organizations.find((o) => o.id === selectedOrgId)?.name ||
                  "Selected Organization"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedOrgId ? (
                <p className="text-muted-foreground text-center py-8">
                  Please select an organization to view users
                </p>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No users in this organization yet
                </p>
              ) : (
                <div className="space-y-4">
                  {users.map((u) => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
