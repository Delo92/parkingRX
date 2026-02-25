import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/contexts/AuthContext";
import { useConfig } from "@/contexts/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { SiGoogle } from "react-icons/si";

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

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  medicalCondition: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  hasMedicare: z.boolean().default(false),
  ssn: z.string().optional(),
  isVeteran: z.boolean().default(false),
  referralCode: z.string().optional(),
  smsConsent: z.boolean().refine(val => val === true, { message: "SMS consent is required to use our services" }),
  emailConsent: z.boolean().refine(val => val === true, { message: "Email consent is required to use our services" }),
  chargeUnderstanding: z.boolean().refine(val => val === true, { message: "You must acknowledge the charge information" }),
  patientAuthorization: z.boolean().refine(val => val === true, { message: "Authorization is required" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const { config } = useConfig();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const referralCode = params.get("ref") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      medicalCondition: "",
      driverLicenseNumber: "",
      hasMedicare: false,
      ssn: "",
      isVeteran: false,
      referralCode: referralCode,
      smsConsent: false,
      emailConsent: false,
      chargeUnderstanding: false,
      patientAuthorization: false,
    },
  });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      toast({
        title: "Account created!",
        description: `Welcome, ${user.firstName}! Please complete your profile to apply for a permit.`,
      });
      setLocation("/dashboard/applicant/registration");
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        toast({
          title: "Sign up failed",
          description: error.message || "Could not sign up with Google",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        middleName: data.middleName,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        driverLicenseNumber: data.driverLicenseNumber,
        medicalCondition: data.medicalCondition,
        ssn: data.ssn,
        hasMedicare: data.hasMedicare,
        isVeteran: data.isVeteran,
        referralCode: data.referralCode,
        smsConsent: data.smsConsent,
        emailConsent: data.emailConsent,
        chargeUnderstanding: data.chargeUnderstanding,
        patientAuthorization: data.patientAuthorization,
      });
      toast({
        title: "Account created!",
        description: "Welcome! Your account has been created successfully.",
      });
      setLocation("/dashboard/applicant");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="py-8 border-b bg-[hsl(var(--section-bg))]">
        <div className="container">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with your handicap parking permit application</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl space-y-6">
          <Button variant="ghost" asChild className="mb-4" data-testid="button-back-home">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--heading-color))' }}>
                  {config.siteName}
                </span>
              </div>
              <CardTitle className="text-2xl" data-testid="text-register-title">Create an account</CardTitle>
              <CardDescription>
                Apply for your handicap parking permit quickly and securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Please ensure you have personal access to this email.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  data-testid="input-password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  data-testid="input-confirm-password"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  data-testid="button-toggle-confirm-password"
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">This information will be used on your medical forms</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" placeholder="mm/dd/yyyy" data-testid="input-dob" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Address Information</h3>
                    <p className="text-sm text-muted-foreground">Please verify your address does not have a P.O. Box. You WILL BE DENIED if you use a P.O. Box. This information will be used on your medical forms.</p>

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Medical Information (Optional)</h3>
                    <p className="text-sm text-muted-foreground">This is optional. You can provide this information now or update it later in your profile.</p>

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
                          <FormDescription>Required for Oklahoma Forms 302DC and 750-C.</FormDescription>
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
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Referral Code (Optional)</h3>
                    <FormField
                      control={form.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter referral code (e.g., SMITH2025)"
                              data-testid="input-referral-code"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Have a referral code? Enter it here to get personalized service.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Communication Consent (Required)</h3>
                    <p className="text-sm text-muted-foreground">Both SMS and email consent are required to use our services. These communications are essential for coordinating your healthcare consultations and ensuring timely updates about your care.</p>

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
                              I consent to receive emails at the email address provided for appointment notifications, account updates, service announcements, and healthcare-related communications. I can unsubscribe from non-essential emails at any time.
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
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || isGoogleLoading}
                    data-testid="button-submit-register"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                data-testid="button-google-signup"
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SiGoogle className="mr-2 h-4 w-4" />
                )}
                Sign up with Google
              </Button>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
