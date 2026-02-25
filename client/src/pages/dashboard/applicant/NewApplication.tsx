import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Package } from "@shared/schema";
import { ArrowLeft, ArrowRight, Check, Loader2, AlertCircle, User } from "lucide-react";

const applicationSchema = z.object({
  packageId: z.string().min(1, "Please select a permit type"),
  reason: z.string().min(10, "Please provide more details about your condition"),
  additionalInfo: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

function isProfileComplete(profile: any): boolean {
  return !!(
    profile?.firstName &&
    profile?.lastName &&
    profile?.phone &&
    profile?.dateOfBirth &&
    profile?.address &&
    profile?.city &&
    profile?.state &&
    profile?.zipCode &&
    profile?.smsConsent &&
    profile?.emailConsent &&
    profile?.chargeUnderstanding &&
    profile?.patientAuthorization
  );
}

export default function NewApplication() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedPackage = params.get("package") || "";

  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const profileComplete = isProfileComplete(profile);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      packageId: preselectedPackage,
      reason: "",
      additionalInfo: "",
    },
  });

  const createApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const fullName = [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(" ");
      const formData = {
        ...data,
        ...customFields,
        fullName,
        firstName: profile?.firstName,
        middleName: profile?.middleName,
        lastName: profile?.lastName,
        email: profile?.email,
        phone: profile?.phone,
        dateOfBirth: profile?.dateOfBirth,
        address: profile?.address,
        city: profile?.city,
        state: profile?.state,
        zipCode: profile?.zipCode,
        driverLicenseNumber: profile?.driverLicenseNumber,
        medicalCondition: profile?.medicalCondition,
        ssn: profile?.ssn,
        hasMedicare: profile?.hasMedicare,
        isVeteran: profile?.isVeteran,
      };
      const response = await apiRequest("POST", "/api/applications", {
        packageId: data.packageId,
        formData,
        autoSendToDoctor: true,
      });
      return response.json();
    },
    onSuccess: (application) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Order Submitted!",
        description: "Your handicap permit application has been submitted successfully.",
      });
      setLocation(`/dashboard/applicant/applications/${application.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const selectedPackage = packages?.find((p) => p.id === form.watch("packageId"));

  const nextStep = () => {
    if (step === 1 && !form.getValues("packageId")) {
      form.setError("packageId", { message: "Please select a permit type" });
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = (data: ApplicationFormData) => {
    createApplication.mutate(data);
  };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profileComplete) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/applicant">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-new-app-title">
                Apply for Handicap Permit
              </h1>
            </div>
          </div>

          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Please complete your profile before applying for a permit. We need your personal information, address, and consent to process your application.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile First</CardTitle>
              <CardDescription>
                Your profile information will be used on your medical forms and permit application. All required fields must be filled out before you can submit an application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/applicant/registration">
                <Button className="w-full" data-testid="button-complete-profile">
                  <User className="mr-2 h-4 w-4" />
                  Complete My Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(" ");

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/applicant">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-new-app-title">
              Apply for Handicap Permit
            </h1>
            <p className="text-muted-foreground">
              Step {step} of {totalSteps}
            </p>
          </div>
        </div>

        <Progress value={(step / totalSteps) * 100} className="h-2" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && (
              <Card data-testid="step-package-selection">
                <CardHeader>
                  <CardTitle>Select Permit Type</CardTitle>
                  <CardDescription>
                    Choose the type of handicap parking permit you need
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {packagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="packageId"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              {packages?.map((pkg) => (
                                <div key={pkg.id}>
                                  <RadioGroupItem
                                    value={pkg.id}
                                    id={pkg.id}
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor={pkg.id}
                                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover-elevate transition-all"
                                    data-testid={`package-option-${pkg.id}`}
                                  >
                                    <div>
                                      <p className="font-semibold">{pkg.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {pkg.description}
                                      </p>
                                    </div>
                                    <div className="text-xl font-bold text-primary">
                                      ${Number(pkg.price).toFixed(2)}
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card data-testid="step-review-info">
                  <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                    <CardDescription>
                      This information is pulled from your profile and will be used on your permit application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="font-medium" data-testid="text-review-name">{fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-medium" data-testid="text-review-email">{profile?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="font-medium" data-testid="text-review-phone">{profile?.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                        <p className="font-medium" data-testid="text-review-dob">{profile?.dateOfBirth}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Address</p>
                        <p className="font-medium" data-testid="text-review-address">
                          {profile?.address}, {profile?.city}, {profile?.state} {profile?.zipCode}
                        </p>
                      </div>
                      {profile?.driverLicenseNumber && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Driver's License / ID</p>
                          <p className="font-medium" data-testid="text-review-dl">{profile.driverLicenseNumber}</p>
                        </div>
                      )}
                      {profile?.medicalCondition && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Medical Condition</p>
                          <p className="font-medium" data-testid="text-review-condition">{profile.medicalCondition}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/dashboard/applicant/registration">
                        <Button variant="outline" size="sm" type="button" data-testid="button-edit-profile">
                          Edit Profile Information
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="step-application-details">
                  <CardHeader>
                    <CardTitle>Permit Details</CardTitle>
                    <CardDescription>
                      Provide the details needed for your permit application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray((selectedPackage as any)?.formFields) && (selectedPackage as any).formFields.length > 0 && (
                      <div className="space-y-4">
                        {(selectedPackage as any).formFields.map((field: any, idx: number) => (
                          <div key={field.name || idx}>
                            <Label className="mb-1.5 block">
                              {field.label || field.name}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {field.type === "textarea" ? (
                              <Textarea
                                placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                                value={customFields[field.name] || ""}
                                onChange={(e) => setCustomFields({ ...customFields, [field.name]: e.target.value })}
                                data-testid={`input-custom-${field.name}`}
                                className="min-h-[80px]"
                              />
                            ) : field.type === "select" ? (
                              <Select
                                value={customFields[field.name] || ""}
                                onValueChange={(value) => setCustomFields({ ...customFields, [field.name]: value })}
                              >
                                <SelectTrigger data-testid={`select-custom-${field.name}`}>
                                  <SelectValue placeholder={`Select ${field.label || field.name}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(field.options || []).map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={field.type === "phone" ? "tel" : field.type || "text"}
                                placeholder={field.placeholder || `Enter ${field.label || field.name}`}
                                value={customFields[field.name] || ""}
                                onChange={(e) => setCustomFields({ ...customFields, [field.name]: e.target.value })}
                                data-testid={`input-custom-${field.name}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Permit <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Why do you need a handicap parking permit? (e.g., mobility impairment, post-surgery recovery, chronic condition, etc.)"
                              className="min-h-[120px]"
                              data-testid="input-reason"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other details you'd like to share..."
                              className="min-h-[80px]"
                              data-testid="input-additional"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 3 && (
              <Card data-testid="step-review-submit">
                <CardHeader>
                  <CardTitle>Review & Submit</CardTitle>
                  <CardDescription>
                    Review your order details before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Selected Permit Type</p>
                    <p className="text-lg font-bold" data-testid="text-selected-package">{selectedPackage?.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedPackage?.description}</p>
                    <p className="text-2xl font-bold text-primary mt-2" data-testid="text-selected-price">
                      ${selectedPackage ? Number(selectedPackage.price).toFixed(2) : "0.00"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Applicant Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        <span className="font-medium">{fullName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="font-medium">{profile?.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{" "}
                        <span className="font-medium">{profile?.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DOB:</span>{" "}
                        <span className="font-medium">{profile?.dateOfBirth}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Address:</span>{" "}
                        <span className="font-medium">{profile?.address}, {profile?.city}, {profile?.state} {profile?.zipCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Permit Details</h4>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      <span className="font-medium">{form.getValues("reason")}</span>
                    </div>
                    {form.getValues("additionalInfo") && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Additional Info:</span>{" "}
                        <span className="font-medium">{form.getValues("additionalInfo")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between mt-6">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/applicant">Cancel</Link>
                </Button>
              )}

              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} data-testid="button-next-step">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createApplication.isPending}
                  data-testid="button-submit-application"
                >
                  {createApplication.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Submit Order
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
