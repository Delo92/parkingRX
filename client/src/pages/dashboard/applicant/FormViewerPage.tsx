import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { GizmoForm, GizmoFormData } from "@/components/GizmoForm";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function FormViewerPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = params.applicationId;

  const { data, isLoading, error } = useQuery<GizmoFormData>({
    queryKey: ["/api/forms/data", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/forms/data/${applicationId}`, {
        headers: {
          Authorization: `Bearer ${await (await import("@/lib/firebase")).auth.currentUser?.getIdToken()}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load form data");
      return res.json();
    },
    enabled: !!applicationId,
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/applicant/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-form-viewer-title">
              Physician Recommendation Form
            </h1>
            <p className="text-muted-foreground">
              Review, edit, and download your completed form
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-destructive font-medium">Failed to load form data</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/applicant/documents">Back to Documents</Link>
            </Button>
          </div>
        )}

        {data && data.gizmoFormUrl && (
          <GizmoForm data={data} onClose={() => window.history.back()} />
        )}

        {data && !data.gizmoFormUrl && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No PDF template is assigned to this application's reviewing physician.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/applicant/documents">Back to Documents</Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
