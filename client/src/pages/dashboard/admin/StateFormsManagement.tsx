import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MapPin, Upload, Loader2, CheckCircle, FileText, Plus, Trash2 } from "lucide-react";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

export default function StateFormsManagement() {
  const { getIdToken } = useAuth();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: stateTemplates, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/state-forms"],
  });

  const handleUpload = async (file: File) => {
    if (!selectedState) {
      toast({ title: "Select a state first", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stateName", selectedState);

      const token = await getIdToken();
      const stateCode = selectedState.trim().toLowerCase();
      const res = await fetch(`/api/admin/state-forms/${stateCode}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/admin/state-forms"] });
      toast({ title: "Form Uploaded", description: `PDF form saved for ${selectedState}` });
      setShowUploadDialog(false);
      setSelectedState("");
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const statesWithForms = new Set(stateTemplates?.map(t => t.stateName?.toLowerCase() || t.stateCode) || []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-state-forms-title">
            State Forms
          </h1>
          <p className="text-muted-foreground">
            Upload and manage the official PDF form for each state. When a patient applies, the system uses their state to select the correct form.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  State Form Templates
                </CardTitle>
                <CardDescription>
                  {stateTemplates?.length || 0} state{(stateTemplates?.length || 0) !== 1 ? "s" : ""} configured
                </CardDescription>
              </div>
              <Button onClick={() => setShowUploadDialog(true)} data-testid="button-add-state-form">
                <Plus className="h-4 w-4 mr-2" />
                Add State Form
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stateTemplates && stateTemplates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Form Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stateTemplates
                    .sort((a, b) => (a.stateName || a.stateCode || "").localeCompare(b.stateName || b.stateCode || ""))
                    .map((template) => (
                    <TableRow key={template.id || template.stateCode} data-testid={`state-form-row-${template.stateCode}`}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {template.stateName || template.stateCode?.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {template.gizmoFormUrl ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" /> PDF Uploaded
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Form</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {template.gizmoFormUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(template.gizmoFormUrl, "_blank")}
                              data-testid={`button-view-form-${template.stateCode}`}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedState(template.stateName || template.stateCode?.toUpperCase() || "");
                              setShowUploadDialog(true);
                            }}
                            data-testid={`button-replace-form-${template.stateCode}`}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No state forms configured yet</p>
                <p className="text-sm mt-1">Upload a PDF form for each state your service covers.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {selectedState ? `Upload Form for ${selectedState}` : "Upload State Form"}
              </DialogTitle>
              <DialogDescription>
                Upload the official PDF form for a state. This form will be auto-filled with patient and doctor data when an application is approved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger data-testid="select-state-form-state">
                    <SelectValue placeholder="Select a state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state} {statesWithForms.has(state.toLowerCase()) ? "✓" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PDF Form File</Label>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  id="state-form-upload"
                  data-testid="input-state-form-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!selectedState || uploading}
                  onClick={() => document.getElementById("state-form-upload")?.click()}
                  data-testid="button-choose-state-form-file"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? "Uploading..." : "Choose PDF File"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
