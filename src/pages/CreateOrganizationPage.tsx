import { useState } from "react";
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
import { Building2, ArrowLeft } from "lucide-react";
import { createOrganization, updateUser } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function CreateOrganizationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState<
    "free" | "basic" | "premium"
  >("free");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Current user object in CreateOrganizationPage:", user);
    console.log(
      "Current firebaseUser object in CreateOrganizationPage:",
      firebaseUser,
    );
    if (!name.trim() || !firebaseUser) {
      toast({
        title: "Error",
        description: !name.trim()
          ? "Organization name is required"
          : "You must be logged in to create an organization",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use firebaseUser for uid, and either user.name or email as name
      const createdBy = firebaseUser.uid;
      const createdByName =
        user?.name ||
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0] ||
        "Admin";

      const orgData = {
        name,
        email,
        phone,
        address,
        subscriptionPlan,
        isActive: true,
        createdBy,
        createdByName,
        createdAt: Date.now(),
      };
      console.log("Creating organization with data:", orgData);

      const orgId = await createOrganization(orgData);

      console.log("Organization created successfully with ID:", orgId);

      // Check if user database profile exists; if not, create it first
      if (!user) {
        console.log("Creating new user database profile!");
        await createUser(firebaseUser.uid, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || email,
          name: createdByName,
          role: "admin", // Make the creator an admin
          organizationId: orgId,
          createdAt: Date.now(),
          sessionId: user?.sessionId, // If user exists, keep sessionId; else, let it be set later
        });
      } else {
        // Update existing user with organizationId
        console.log("Updating existing user with organizationId:", orgId);
        await updateUser(firebaseUser.uid, { organizationId: orgId });
      }

      console.log("User updated/created successfully with organizationId!");

      toast({
        title: "Organization Created",
        description: "Your organization has been created successfully",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/select-organization")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Create New Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select
                  value={subscriptionPlan}
                  onValueChange={(value: any) => setSubscriptionPlan(value)}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
