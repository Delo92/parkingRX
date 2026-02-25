import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Eye, FolderOpen, Printer, Calendar, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

interface DocumentRecord {
  id: string;
  applicationId: string;
  userId: string;
  name: string;
  type: string;
  status: string;
  fileUrl: string;
  metadata: any;
  createdAt: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents, isLoading } = useQuery<DocumentRecord[]>({
    queryKey: ["/api/documents"],
  });

  const completedDocs = documents?.filter((d) => d.status === "completed") || [];
  const otherDocs = documents?.filter((d) => d.status !== "completed") || [];

  const handleViewDocument = async (doc: DocumentRecord) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast({ title: "Not authenticated", description: "Please log in again.", variant: "destructive" });
        return;
      }
      window.open(`/api/documents/${doc.id}/html?token=${encodeURIComponent(token)}`, "_blank");
    } catch {
      toast({ title: "Error", description: "Failed to open document.", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      toast({
        title: "Upload Started",
        description: "Your document has been uploaded successfully.",
      });
      setIsUploadOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-documents-title">
              My Certificates
            </h1>
            <p className="text-muted-foreground">
              View and download your handicap permit documents
            </p>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} data-testid="button-upload-document">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Certificates</CardTitle>
            <CardDescription>
              Download your completed certifications here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : completedDocs.length > 0 ? (
              <div className="space-y-3">
                {completedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`text-doc-name-${doc.id}`}>{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.metadata?.doctorName && (
                            <span>- Certified by {doc.metadata.doctorName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Ready
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        data-testid={`button-view-doc-${doc.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        data-testid={`button-print-doc-${doc.id}`}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print / PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Your completed certifications will appear here for download once your registration is processed and approved by a medical professional.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {otherDocs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Documents</CardTitle>
              <CardDescription>
                Documents currently being prepared
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {otherDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`document-pending-${doc.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{doc.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents (Optional)</CardTitle>
            <CardDescription>
              You may upload additional documents if needed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Photo ID</p>
                    <p className="text-sm text-muted-foreground">Government-issued ID (driver's license, passport)</p>
                  </div>
                </div>
                <Badge variant="outline">Not uploaded</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Additional Documentation</p>
                    <p className="text-sm text-muted-foreground">Any supporting materials for your order</p>
                  </div>
                </div>
                <Badge variant="outline">Not uploaded</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Supporting File</DialogTitle>
              <DialogDescription>
                Select a file to upload. Supported formats: PDF, JPG, PNG (max 10MB)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">Click to select a file</p>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                </label>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5" />
                  <span className="flex-1 truncate">{selectedFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile} data-testid="button-confirm-upload">
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
