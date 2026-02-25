import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  driverLicenseNumber: z.string().optional(),
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  medicalCondition: z.string().optional(),
  hasMedicare: z.boolean().default(false),
  ssn: z.string().optional(),
  isVeteran: z.boolean().default(false),
  referralCode: z.string().optional(),
  smsConsent: z.boolean().refine(val => val === true, { message: "SMS consent is required to use our services" }),
  emailConsent: z.boolean().refine(val => val === true, { message: "Email consent is required to use our services" }),
  chargeUnderstanding: z.boolean().refine(val => val === true, { message: "You must acknowledge the charge information" }),
  patientAuthorization: z.boolean().refine(val => val === true, { message: "Authorization is required" }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function isProfileComplete(data: any): boolean {
  return !!(
    data?.firstName &&
    data?.lastName &&
    data?.phone &&
    data?.dateOfBirth &&
    data?.address &&
    data?.city &&
    data?.state &&
    data?.zipCode &&
    data?.smsConsent &&
    data?.emailConsent &&
    data?.chargeUnderstanding &&
    data?.patientAuthorization
  );
}

export default function RegistrationPage() {
  const { user, refreshUser, getIdToken } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const profileComplete = isProfileComplete(profile);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      driverLicenseNumber: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      medicalCondition: "",
      hasMedicare: false,
      ssn: "",
      isVeteran: false,
      referralCode: "",
      smsConsent: false,
      emailConsent: false,
      chargeUnderstanding: false,
      patientAuthorization: false,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        middleName: profile.middleName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        driverLicenseNumber: profile.driverLicenseNumber || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        zipCode: profile.zipCode || "",
        medicalCondition: profile.medicalCondition || "",
        hasMedicare: profile.hasMedicare || false,
        ssn: profile.ssn || "",
        isVeteran: profile.isVeteran || false,
        referralCode: profile.referralCode || "",
        smsConsent: profile.smsConsent || false,
        emailConsent: profile.emailConsent || false,
        chargeUnderstanding: profile.chargeUnderstanding || false,
        patientAuthorization: profile.patientAuthorization || false,
      });
    }
  }, [profile]);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSaving(true);
    try {
      const { email, ...profileData } = data;
      await apiRequest("PUT", "/api/profile", {
        ...profileData,
        registrationComplete: true,
      });
      await refreshUser();
      toast({
        title: "Profile Saved",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-registration-title">
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Complete your profile to apply for a handicap parking permit
            </p>
          </div>
          <Link href="/packages">
            <Button data-testid="button-buy-package" disabled={!profileComplete}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Apply for Permit
            </Button>
          </Link>
        </div>

        {profileComplete ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400" data-testid="text-profile-complete">
              Your profile is complete. You can now apply for a handicap parking permit.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400" data-testid="text-profile-incomplete">
              Please complete all required fields and consent checkboxes below before applying for a permit.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account login details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-sm mt-1" data-testid="text-username">Will be generated from email</p>
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" disabled data-testid="input-email" {...field} />
                      </FormControl>
                      <FormDescription>Please ensure you have personal access to this email.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>This information will be used on your medical forms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" data-testid="input-first-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your middle name" data-testid="input-middle-name" {...field} />
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
                          <Input placeholder="Enter your last name" data-testid="input-last-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="Enter your phone number" data-testid="input-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" data-testid="input-dob" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>
                  Please verify your address does not have a P.O. Box. You WILL BE DENIED if you use a P.O. Box. This information will be used on your medical forms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your street address" data-testid="input-address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your city" data-testid="input-city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((st) => (
                              <SelectItem key={st} value={st}>{st}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your ZIP code" data-testid="input-zip" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>
                  This is optional. You can provide this information now or update it later in your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="medicalCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Condition or Reason for Permit</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., Chronic pain, mobility impairment, post-surgery recovery... (optional)"
                          data-testid="input-medical-condition"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        If you're not sure what your state's qualifying conditions are, you can leave this blank and provide it later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverLicenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver's License / ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your driver's license or state ID number" data-testid="input-driver-license" {...field} />
                      </FormControl>
                      <FormDescription>
                        Required for Oklahoma Forms 302DC and 750-C. You can add this now or update it later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasMedicare"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-medicare"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Do you have Medicare/Medicaid?</FormLabel>
                        <FormDescription>
                          This helps us provide you with information about potential cost savings on state application fees.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123-45-6789" data-testid="input-ssn" {...field} />
                      </FormControl>
                      <FormDescription>Some states request this information for the application process. Format: XXX-XX-XXXX</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isVeteran"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-veteran"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Disabled Veteran</FormLabel>
                        <FormDescription>
                          Check this box if you are a disabled veteran. This may help us provide you with special considerations.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Code (Optional)</CardTitle>
                <CardDescription>Have a referral code? Enter it here to get personalized service.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter referral code (e.g., SMITH2025)" data-testid="input-referral-code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Consent (Required)</CardTitle>
                <CardDescription>
                  Both SMS and email consent are required to use our services. These communications are essential for coordinating your healthcare consultations and ensuring timely updates about your care.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="smsConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-sms-consent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>SMS/Text Message Consent <span className="text-destructive">*</span></FormLabel>
                        <FormDescription>
                          I consent to receive text messages (SMS/MMS) at the phone number provided for appointment reminders, consultation notifications, account updates, and service-related communications. Message and data rates may apply. I can reply STOP to opt out at any time.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-email-consent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Email Communication Consent <span className="text-destructive">*</span></FormLabel>
                        <FormDescription>
                          I consent to receive emails at the email address provided for appointment notifications, account updates, service announcements, and healthcare-related communications. I can unsubscribe from non-essential emails at any time by clicking the unsubscribe link.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chargeUnderstanding"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-charge-understanding"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Charge Understanding <span className="text-destructive">*</span></FormLabel>
                        <FormDescription>
                          I understand the charge name that will appear on my bank statement and that disputed charges may delay getting my recommendation or permit.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="patientAuthorization"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-patient-auth"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Applicant Authorization <span className="text-destructive">*</span></FormLabel>
                        <FormDescription>
                          I authorize the platform and its staff to access my information to assist with submitting my handicap parking permit application.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={isSaving} data-testid="button-save-registration">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
