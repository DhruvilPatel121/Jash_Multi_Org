import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import {
  getAllOrganizations,
  getUsersByOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateUser,
  deleteUser,
} from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Organization, User, UserRole } from "@/types";

export default function SuperAdminDashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("organizations");
  const navigate = useNavigate();
  const { user, createUserAsSuperAdmin } = useAuth();
  const { toast } = useToast();

  // Organization form state
  const [orgFormOpen, setOrgFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgSubscription, setOrgSubscription] = useState<
    "free" | "basic" | "premium"
  >("free");

  // User form state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] =
    useState<Exclude<UserRole, "superadmin">>("admin");

  const [loading, setLoading] = useState(false);

  // Check if current user is super admin
  useEffect(() => {
    if (user && user.role !== "superadmin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Load organizations
  const loadOrganizations = async () => {
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
  };

  // Load users for selected organization
  const loadUsers = async (orgId: string) => {
    if (!orgId) {
      setUsers([]);
      return;
    }
    try {
      const orgUsers = await getUsersByOrganization(orgId);
      setUsers(orgUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [toast]);

  useEffect(() => {
    loadUsers(selectedOrgId);
  }, [selectedOrgId]);

  // Organization handlers
  const handleOpenOrgForm = (org?: Organization) => {
    if (org) {
      setEditingOrg(org);
      setOrgName(org.name);
      setOrgEmail(org.email || "");
      setOrgPhone(org.phone || "");
      setOrgAddress(org.address || "");
      setOrgSubscription(org.subscriptionPlan || "free");
    } else {
      setEditingOrg(null);
      setOrgName("");
      setOrgEmail("");
      setOrgPhone("");
      setOrgAddress("");
      setOrgSubscription("free");
    }
    setOrgFormOpen(true);
  };

  const handleSaveOrg = async () => {
    if (!orgName.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, {
          name: orgName,
          email: orgEmail,
          phone: orgPhone,
          address: orgAddress,
          subscriptionPlan: orgSubscription,
        });
        toast({
          title: "Success",
          description: "Organization updated successfully",
        });
      } else {
        await createOrganization({
          name: orgName,
          email: orgEmail,
          phone: orgPhone,
          address: orgAddress,
          subscriptionPlan: orgSubscription,
          isActive: true,
          createdBy: user?.uid || "",
          createdByName: user?.name || "Super Admin",
          createdAt: Date.now(),
        });
        toast({
          title: "Success",
          description: "Organization created successfully",
        });
      }
      setOrgFormOpen(false);
      await loadOrganizations();
    } catch (error: any) {
      console.error("Error saving organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrg = async (org: Organization) => {
    if (
      !confirm(
        `Are you sure you want to delete organization "${org.name}"? This will delete all data for this organization.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await deleteOrganization(org.id);
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
      if (selectedOrgId === org.id) {
        setSelectedOrgId("");
      }
      await loadOrganizations();
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // User handlers
  const handleOpenUserForm = (usr?: User) => {
    if (usr) {
      setEditingUser(usr);
      setUserName(usr.name);
      setUserEmail(usr.email);
      setUserPassword("");
      setUserRole(usr.role as Exclude<UserRole, "superadmin">);
    } else {
      setEditingUser(null);
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserRole("admin");
    }
    setUserFormOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    if (!editingUser) {
      if (!userPassword.trim()) {
        toast({
          title: "Error",
          description: "Password is required for new users",
          variant: "destructive",
        });
        return;
      }
      if (!selectedOrgId) {
        toast({
          title: "Error",
          description: "Please select an organization first",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.uid, {
          name: userName,
          email: userEmail,
          role: userRole,
        });
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        const { error } = await createUserAsSuperAdmin(
          userEmail,
          userPassword,
          userName,
          userRole,
          selectedOrgId,
        );
        if (error) throw error;
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      setUserFormOpen(false);
      await loadUsers(selectedOrgId);
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (usr: User) => {
    if (!confirm(`Are you sure you want to delete user "${usr.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteUser(usr.uid);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      await loadUsers(selectedOrgId);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
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
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="organizations"
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Manage Organizations</h2>
              <Button onClick={() => handleOpenOrgForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Organization
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {org.email && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {org.email}
                      </p>
                    )}
                    {org.phone && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {org.phone}
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenOrgForm(org)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteOrg(org)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedOrgId(org.id);
                          setActiveTab("users");
                        }}
                      >
                        Manage Users
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {organizations.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No organizations yet. Create your first one!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full md:w-auto">
                <Label htmlFor="org-select">Select Organization</Label>
                <Select
                  value={selectedOrgId}
                  onValueChange={(value) => setSelectedOrgId(value)}
                >
                  <SelectTrigger id="org-select" className="w-full md:w-80">
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
              <Button
                onClick={() => handleOpenUserForm()}
                disabled={!selectedOrgId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
            {selectedOrgId && (
              <h2 className="text-2xl font-bold">
                Users for{" "}
                {organizations.find((o) => o.id === selectedOrgId)?.name}
              </h2>
            )}
            {selectedOrgId ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((usr) => (
                  <Card key={usr.uid}>
                    <CardHeader>
                      <CardTitle className="text-lg">{usr.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-1">
                        {usr.email}
                      </p>
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                        {usr.role}
                      </span>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenUserForm(usr)}
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(usr)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {users.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">
                        No users yet for this organization. Create your first
                        one!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Please select an organization first!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Organization Dialog */}
        <Dialog open={orgFormOpen} onOpenChange={setOrgFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingOrg ? "Edit Organization" : "Create Organization"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <Label htmlFor="orgEmail">Email</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="orgPhone">Phone</Label>
                <Input
                  id="orgPhone"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="orgAddress">Address</Label>
                <Textarea
                  id="orgAddress"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="orgSubscription">Subscription Plan</Label>
                <Select
                  value={orgSubscription}
                  onValueChange={(value: "free" | "basic" | "premium") =>
                    setOrgSubscription(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOrgFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveOrg} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Dialog */}
        <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit User" : "Create User"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editingUser && (
                <div>
                  <Label htmlFor="userOrg">Organization</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {organizations.find((o) => o.id === selectedOrgId)?.name ||
                      "No organization selected"}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter email"
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="userPassword">Password *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="userRole">Role *</Label>
                <Select
                  value={userRole}
                  onValueChange={(value: Exclude<UserRole, "superadmin">) =>
                    setUserRole(value)
                  }
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
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setUserFormOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
