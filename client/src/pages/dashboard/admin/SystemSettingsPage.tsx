import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Mail, Zap, Shield, RefreshCw } from "lucide-react";

const settingsSchema = z.object({
  notificationEmail: z.string().email("Enter a valid email").or(z.literal("")).optional(),
  autoCompleteApplications: z.boolean().default(false),
  maintenanceMode: z.boolean().default(false),
  registrationOpen: z.boolean().default(true),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SystemSettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, any>>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      notificationEmail: "",
      autoCompleteApplications: false,
      maintenanceMode: false,
      registrationOpen: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        notificationEmail: settings.notificationEmail || "",
        autoCompleteApplications: settings.autoCompleteApplications ?? false,
        maintenanceMode: settings.maintenanceMode ?? false,
        registrationOpen: settings.registrationOpen ?? true,
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await apiRequest("PUT", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    saveSettings.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-system-settings-title">
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure email notifications, workflow automation, and platform behavior.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Email Notifications */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Email Notifications</CardTitle>
                      <CardDescription className="text-sm">
                        Where admin alerts and review notifications are sent
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notification Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@parkingrx.com"
                            data-testid="input-notification-email"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          When a new application is sent to a doctor, a copy of the review request is also sent to this address. Leave blank to disable admin notifications.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Application Processing */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Application Processing</CardTitle>
                      <CardDescription className="text-sm">
                        Control how applications are processed and approved
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="autoCompleteApplications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Auto-Complete Applications</FormLabel>
                          <FormDescription className="text-xs">
                            When enabled, applications that require doctor review are automatically approved and the permit document is generated without waiting for manual doctor approval.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-complete"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Platform Control */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Platform Control</CardTitle>
                      <CardDescription className="text-sm">
                        Control platform availability and registration access
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FormField
                    control={form.control}
                    name="registrationOpen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Registration Open</FormLabel>
                          <FormDescription className="text-xs">
                            Allow new applicants to create accounts and submit applications.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-registration-open"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">Maintenance Mode</FormLabel>
                          <FormDescription className="text-xs">
                            Show a maintenance notice to all non-admin users.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-maintenance-mode"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (settings) {
                      form.reset({
                        notificationEmail: settings.notificationEmail || "",
                        autoCompleteApplications: settings.autoCompleteApplications ?? false,
                        maintenanceMode: settings.maintenanceMode ?? false,
                        registrationOpen: settings.registrationOpen ?? true,
                      });
                    }
                  }}
                  data-testid="button-reset-settings"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={saveSettings.isPending}
                  data-testid="button-save-settings"
                >
                  {saveSettings.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Save Settings
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </DashboardLayout>
  );
}
