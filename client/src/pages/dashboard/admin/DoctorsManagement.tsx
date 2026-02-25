import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { Plus, Upload, Trash2, FileText, Eye, Loader2 } from "lucide-react";

interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  licenseNumber: string;
  npiNumber: string;
  deaNumber: string;
  specialty: string;
  phone: string;
  fax: string;
  address: string;
  bio: string;
  documentTemplates?: DocumentTemplate[];
  createdAt: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  url: string;
  fileName: string;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export default function DoctorsManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [templateDoctorId, setTemplateDoctorId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    licenseNumber: "",
    npiNumber: "",
    deaNumber: "",
    specialty: "",
    fax: "",
    address: "",
    bio: "",
  });

  const { data: doctors, isLoading } = useQuery<DoctorProfile[]>({
    queryKey: ["/api/doctor-profiles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/admin/create-doctor", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Doctor created", description: "The doctor account has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateOpen(false);
      setForm({
        firstName: "", lastName: "", email: "", password: "", phone: "",
        licenseNumber: "", npiNumber: "", deaNumber: "", specialty: "",
        fax: "", address: "", bio: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ doctorProfileId, templateId }: { doctorProfileId: string; templateId: string }) => {
      const res = await apiRequest("DELETE", `/api/admin/doctor-templates/${doctorProfileId}/${templateId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profiles"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUploadTemplate = async (doctorProfileId: string, file: File) => {
    setUploading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateName", file.name);

      const res = await fetch(`/api/admin/doctor-templates/${doctorProfileId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      toast({ title: "Template uploaded", description: `${file.name} has been uploaded successfully.` });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profiles"] });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-doctors-title">
              Doctor Management
            </h1>
            <p className="text-muted-foreground">
              Create doctor accounts and manage their document templates
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-doctor">
                <Plus className="h-4 w-4 mr-2" />
                Create Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Doctor Account</DialogTitle>
                <DialogDescription>
                  Create a new doctor account with login credentials and professional details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                      data-testid="input-doctor-firstname"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                      data-testid="input-doctor-lastname"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    data-testid="input-doctor-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    data-testid="input-doctor-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    data-testid="input-doctor-phone"
                  />
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Professional Details</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input
                          id="licenseNumber"
                          value={form.licenseNumber}
                          onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                          data-testid="input-doctor-license"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="npiNumber">NPI Number</Label>
                        <Input
                          id="npiNumber"
                          value={form.npiNumber}
                          onChange={(e) => setForm({ ...form, npiNumber: e.target.value })}
                          data-testid="input-doctor-npi"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="deaNumber">DEA Number</Label>
                        <Input
                          id="deaNumber"
                          value={form.deaNumber}
                          onChange={(e) => setForm({ ...form, deaNumber: e.target.value })}
                          data-testid="input-doctor-dea"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                          id="specialty"
                          value={form.specialty}
                          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                          data-testid="input-doctor-specialty"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="fax">Fax</Label>
                        <Input
                          id="fax"
                          value={form.fax}
                          onChange={(e) => setForm({ ...form, fax: e.target.value })}
                          data-testid="input-doctor-fax"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          data-testid="input-doctor-address"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        rows={2}
                        data-testid="input-doctor-bio"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} data-testid="button-cancel-create-doctor">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-doctor">
                    {createMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                    ) : (
                      "Create Doctor"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : !doctors || doctors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No doctors created yet. Click "Create Doctor" to add one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <Card key={doctor.id} data-testid={`card-doctor-${doctor.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{doctor.fullName}</CardTitle>
                      <CardDescription>
                        {doctor.specialty && <span>{doctor.specialty} · </span>}
                        License: {doctor.licenseNumber || "Not set"}
                        {doctor.npiNumber && <span> · NPI: {doctor.npiNumber}</span>}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Doctor</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{doctor.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fax</p>
                      <p>{doctor.fax || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DEA</p>
                      <p>{doctor.deaNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p>{doctor.address || "—"}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Document Templates</p>
                      <div>
                        <input
                          type="file"
                          ref={templateDoctorId === doctor.id ? fileInputRef : undefined}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadTemplate(doctor.id, file);
                              e.target.value = "";
                            }
                          }}
                          data-testid={`input-template-upload-${doctor.id}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => {
                            setTemplateDoctorId(doctor.id);
                            setTimeout(() => {
                              const input = document.querySelector(`[data-testid="input-template-upload-${doctor.id}"]`) as HTMLInputElement;
                              input?.click();
                            }, 0);
                          }}
                          data-testid={`button-upload-template-${doctor.id}`}
                        >
                          {uploading && templateDoctorId === doctor.id ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                          ) : (
                            <><Upload className="h-4 w-4 mr-2" />Upload Template</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {(!doctor.documentTemplates || doctor.documentTemplates.length === 0) ? (
                      <p className="text-sm text-muted-foreground">No document templates uploaded yet. Upload a PDF or image that will be used for auto-filling approved permits.</p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Template</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Uploaded</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {doctor.documentTemplates.map((template) => (
                              <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {template.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {template.contentType === "application/pdf" ? "PDF" : "Image"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(template.uploadedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(template.url, "_blank")}
                                      data-testid={`button-view-template-${template.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteMutation.mutate({ doctorProfileId: doctor.id, templateId: template.id })}
                                      data-testid={`button-delete-template-${template.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
