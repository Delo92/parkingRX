import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UserProfileModal } from "@/components/shared/UserProfileModal";
import { useAuth } from "@/contexts/AuthContext";
import { useConfig } from "@/contexts/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Search, UserCog, Plus, Loader2, Stethoscope, FileText, Info, DollarSign } from "lucide-react";

const PLACEHOLDERS_REFERENCE = [
  { tag: "{{doctorName}}", desc: "Doctor's full name" },
  { tag: "{{doctorLicense}}", desc: "License number" },
  { tag: "{{doctorNPI}}", desc: "NPI number" },
  { tag: "{{doctorDEA}}", desc: "DEA number" },
  { tag: "{{doctorPhone}}", desc: "Doctor phone" },
  { tag: "{{doctorFax}}", desc: "Doctor fax" },
  { tag: "{{doctorAddress}}", desc: "Doctor address" },
  { tag: "{{doctorSpecialty}}", desc: "Specialty" },
  { tag: "{{doctorState}}", desc: "Doctor state" },
  { tag: "{{patientName}}", desc: "Patient full name" },
  { tag: "{{patientFirstName}}", desc: "First name" },
  { tag: "{{patientLastName}}", desc: "Last name" },
  { tag: "{{patientDOB}}", desc: "Date of birth" },
  { tag: "{{patientPhone}}", desc: "Patient phone" },
  { tag: "{{patientEmail}}", desc: "Patient email" },
  { tag: "{{patientAddress}}", desc: "Patient street" },
  { tag: "{{patientCity}}", desc: "Patient city" },
  { tag: "{{patientState}}", desc: "Patient state" },
  { tag: "{{patientZipCode}}", desc: "Patient zip" },
  { tag: "{{patientSSN}}", desc: "Patient SSN" },
  { tag: "{{patientDriverLicense}}", desc: "Driver license #" },
  { tag: "{{patientMedicalCondition}}", desc: "Medical condition" },
  { tag: "{{reason}}", desc: "Reason for note" },
  { tag: "{{packageName}}", desc: "Note type name" },
  { tag: "{{date}}", desc: "Today (long format)" },
  { tag: "{{dateShort}}", desc: "Today (short)" },
];

const addUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  userLevel: z.string().min(1, "Role is required"),
  doctorFullName: z.string().optional(),
  doctorLicense: z.string().optional(),
  doctorNPI: z.string().optional(),
  doctorDEA: z.string().optional(),
  doctorSpecialty: z.string().optional(),
  doctorPhone: z.string().optional(),
  doctorFax: z.string().optional(),
  doctorAddress: z.string().optional(),
  doctorState: z.string().optional(),
  formTemplate: z.string().optional(),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const { getLevelName } = useConfig();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [manualPaymentUser, setManualPaymentUser] = useState<User | null>(null);
  const [manualPaymentPackageId, setManualPaymentPackageId] = useState("");
  const [manualPaymentReason, setManualPaymentReason] = useState("");
  const [manualPaymentLoading, setManualPaymentLoading] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || user.userLevel === parseInt(levelFilter);
    return matchesSearch && matchesLevel;
  }) || [];

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      userLevel: "1",
      doctorFullName: "",
      doctorLicense: "",
      doctorNPI: "",
      doctorDEA: "",
      doctorSpecialty: "",
      doctorPhone: "",
      doctorFax: "",
      doctorAddress: "",
      doctorState: "",
      formTemplate: "",
    },
  });

  const watchedLevel = form.watch("userLevel");
  const isDoctor = watchedLevel === "2";

  const createUser = useMutation({
    mutationFn: async (data: AddUserFormData) => {
      const payload: Record<string, any> = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userLevel: data.userLevel,
      };

      if (parseInt(data.userLevel) === 2) {
        payload.doctorProfile = {
          fullName: data.doctorFullName || `${data.firstName} ${data.lastName}`,
          licenseNumber: data.doctorLicense || "",
          npiNumber: data.doctorNPI || "",
          deaNumber: data.doctorDEA || "",
          phone: data.doctorPhone || data.phone || "",
          fax: data.doctorFax || "",
          address: data.doctorAddress || "",
          specialty: data.doctorSpecialty || "",
          state: data.doctorState || "",
          formTemplate: data.formTemplate || "",
        };
      }

      const response = await apiRequest("POST", "/api/admin/users", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAddDialogOpen(false);
      form.reset();
      setShowPlaceholders(false);
      toast({
        title: "User Created",
        description: "The new user account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const { data: packages } = useQuery<any[]>({
    queryKey: ["/api/packages"],
  });

  const activePackages = packages?.filter((p: any) => p.isActive) || [];

  const handleOpenProfile = (user: User) => {
    setSelectedUser(user);
  };

  const handleManualPayment = async () => {
    if (!manualPaymentUser || !manualPaymentPackageId) return;
    setManualPaymentLoading(true);
    try {
      const res = await apiRequest("POST", `/api/admin/users/${manualPaymentUser.id}/manual-payment`, {
        packageId: manualPaymentPackageId,
        reason: manualPaymentReason || "Manual payment by admin",
      });
      const data = await res.json();
      toast({
        title: "Manual Payment Processed",
        description: `Application created for ${manualPaymentUser.firstName} ${manualPaymentUser.lastName}. ${data.message || ""}`,
      });
      setManualPaymentUser(null);
      setManualPaymentPackageId("");
      setManualPaymentReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setManualPaymentLoading(false);
    }
  };

  const canEditLevel = currentUser?.userLevel === 4 || currentUser?.userLevel === 5;

  const onSubmit = (data: AddUserFormData) => {
    createUser.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-users-title">
            User Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all users on the platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {users?.length || 0} total users
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                    data-testid="input-search-users"
                  />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-level-filter">
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">{getLevelName(1)}</SelectItem>
                    <SelectItem value="2">{getLevelName(2)}</SelectItem>
                    <SelectItem value="3">{getLevelName(3)}</SelectItem>
                    <SelectItem value="4">{getLevelName(4)}</SelectItem>
                    <SelectItem value="5">{getLevelName(5)}</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-user">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account. For doctors, use the additional tabs to set up their credentials and form template.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Tabs defaultValue="account" className="w-full">
                          <TabsList className="w-full">
                            <TabsTrigger value="account" className="flex-1" data-testid="tab-add-account">Account</TabsTrigger>
                            {isDoctor && (
                              <TabsTrigger value="credentials" className="flex-1" data-testid="tab-add-credentials">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Credentials
                              </TabsTrigger>
                            )}
                            {isDoctor && (
                              <TabsTrigger value="template" className="flex-1" data-testid="tab-add-template">
                                <FileText className="h-3 w-3 mr-1" />
                                Form Template
                              </TabsTrigger>
                            )}
                          </TabsList>

                          <ScrollArea className="h-[400px] mt-4">
                            <TabsContent value="account" className="space-y-4 pr-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                                      <FormControl>
                                        <Input placeholder="First name" data-testid="input-add-first-name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                                      <FormControl>
                                        <Input placeholder="Last name" data-testid="input-add-last-name" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                      <Input type="email" placeholder="user@example.com" data-testid="input-add-email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="Min 8 characters" data-testid="input-add-password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                      <Input type="tel" placeholder="Phone number" data-testid="input-add-phone" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="userLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-add-role">
                                          <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="1">{getLevelName(1)}</SelectItem>
                                        <SelectItem value="2">{getLevelName(2)}</SelectItem>
                                        <SelectItem value="3">{getLevelName(3)}</SelectItem>
                                        <SelectItem value="4">{getLevelName(4)}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {isDoctor && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>Doctor selected — use the <strong>Credentials</strong> and <strong>Form Template</strong> tabs to set up their profile.</span>
                                </div>
                              )}
                            </TabsContent>

                            {isDoctor && (
                              <TabsContent value="credentials" className="space-y-4 pr-4">
                                <FormField
                                  control={form.control}
                                  name="doctorFullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Name (as it appears on documents)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Dr. Jane Smith, MD" data-testid="input-add-doctor-name" {...field} />
                                      </FormControl>
                                      <FormDescription>If left blank, first + last name will be used.</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="doctorLicense"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>License Number</FormLabel>
                                        <FormControl>
                                          <Input placeholder="License #" data-testid="input-add-doctor-license" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="doctorNPI"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>NPI Number</FormLabel>
                                        <FormControl>
                                          <Input placeholder="NPI #" data-testid="input-add-doctor-npi" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="doctorDEA"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>DEA Number</FormLabel>
                                        <FormControl>
                                          <Input placeholder="DEA #" data-testid="input-add-doctor-dea" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="doctorSpecialty"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Specialty</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., Family Medicine" data-testid="input-add-doctor-specialty" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="doctorPhone"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Office Phone</FormLabel>
                                        <FormControl>
                                          <Input type="tel" placeholder="Office phone" data-testid="input-add-doctor-phone" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="doctorFax"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Fax</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Fax number" data-testid="input-add-doctor-fax" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={form.control}
                                  name="doctorAddress"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Office Address</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Full office address" data-testid="input-add-doctor-address" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="doctorState"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Oklahoma" data-testid="input-add-doctor-state" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TabsContent>
                            )}

                            {isDoctor && (
                              <TabsContent value="template" className="space-y-4 pr-4">
                                <div className="p-3 bg-muted/50 border rounded-md text-sm text-muted-foreground flex items-start gap-2">
                                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>
                                    Use placeholder tags like <code className="bg-muted px-1 rounded font-mono text-xs">{"{{patientName}}"}</code> in your HTML template. They will be replaced with real data when a document is generated upon approval.
                                  </span>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowPlaceholders(!showPlaceholders)}
                                  data-testid="button-toggle-placeholders"
                                >
                                  {showPlaceholders ? "Hide" : "Show"} Available Placeholders
                                </Button>

                                {showPlaceholders && (
                                  <div className="border rounded-md p-3 bg-muted/30">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                      {PLACEHOLDERS_REFERENCE.map((p) => (
                                        <div key={p.tag} className="flex items-center justify-between py-0.5">
                                          <code className="font-mono bg-muted px-1 rounded">{p.tag}</code>
                                          <span className="text-muted-foreground ml-2">{p.desc}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <FormField
                                  control={form.control}
                                  name="formTemplate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>HTML Form Template</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="<html>&#10;<body>&#10;  <h1>Medical Document</h1>&#10;  <p>Patient: {{patientName}}</p>&#10;  <p>Doctor: {{doctorName}}</p>&#10;  <p>License: {{doctorLicense}}</p>&#10;</body>&#10;</html>"
                                          className="min-h-[200px] font-mono text-xs"
                                          data-testid="input-add-form-template"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        This HTML template will be used to generate documents when the doctor approves an application.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TabsContent>
                            )}
                          </ScrollArea>
                        </Tabs>

                        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                          <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createUser.isPending} data-testid="button-submit-add-user">
                            {createUser.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Create User
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-1.5">
                              {user.userLevel === 2 && <Stethoscope className="h-3.5 w-3.5 text-blue-600" />}
                              {user.firstName} {user.lastName}
                            </span>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getLevelName(user.userLevel)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "destructive"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {user.userLevel === 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setManualPaymentUser(user);
                                    setManualPaymentPackageId("");
                                    setManualPaymentReason("");
                                  }}
                                  data-testid={`button-manual-payment-${user.id}`}
                                  title="Manual Payment"
                                >
                                  <DollarSign className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenProfile(user)}
                                data-testid={`button-view-profile-${user.id}`}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          canEditLevel={canEditLevel}
        />

        <Dialog open={!!manualPaymentUser} onOpenChange={(open) => { if (!open) setManualPaymentUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Manual Payment
              </DialogTitle>
              <DialogDescription>
                Process a manual payment for {manualPaymentUser?.firstName} {manualPaymentUser?.lastName}. This will create an application and run it through the full workflow as if the patient paid on their own.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Select Package</Label>
                <Select value={manualPaymentPackageId} onValueChange={setManualPaymentPackageId}>
                  <SelectTrigger data-testid="select-manual-payment-package">
                    <SelectValue placeholder="Choose a registration type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePackages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={pkg.id} data-testid={`select-package-${pkg.id}`}>
                        {pkg.name} — ${(Number(pkg.price) / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason for Manual Payment</Label>
                <Textarea
                  placeholder="e.g. Phone payment, cash payment, courtesy waiver..."
                  value={manualPaymentReason}
                  onChange={(e) => setManualPaymentReason(e.target.value)}
                  rows={3}
                  data-testid="input-manual-payment-reason"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setManualPaymentUser(null)}
                disabled={manualPaymentLoading}
                data-testid="button-cancel-manual-payment"
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualPayment}
                disabled={!manualPaymentPackageId || manualPaymentLoading}
                data-testid="button-confirm-manual-payment"
              >
                {manualPaymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Payment"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
