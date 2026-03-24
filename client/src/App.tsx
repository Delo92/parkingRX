import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Packages = lazy(() => import("@/pages/Packages"));
const SetupRequired = lazy(() => import("@/pages/SetupRequired"));
const NotFound = lazy(() => import("@/pages/not-found"));
const DoctorReviewPortal = lazy(() => import("@/pages/DoctorReviewPortal"));

import ApplicantDashboard from "@/pages/dashboard/ApplicantDashboard";
import NewApplication from "@/pages/dashboard/applicant/NewApplication";
import DoctorDashboard from "@/pages/dashboard/DoctorDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import UsersManagement from "@/pages/dashboard/admin/UsersManagement";
import PackagesManagement from "@/pages/dashboard/admin/PackagesManagement";

import OwnerDashboard from "@/pages/dashboard/OwnerDashboard";
import SiteSettings from "@/pages/dashboard/owner/SiteSettings";
import RegistrationPage from "@/pages/dashboard/applicant/RegistrationPage";
import DocumentsPage from "@/pages/dashboard/applicant/DocumentsPage";
import FormViewerPage from "@/pages/dashboard/applicant/FormViewerPage";
import PaymentsPage from "@/pages/dashboard/applicant/PaymentsPage";
import SharedSettingsPage from "@/pages/dashboard/shared/SettingsPage";
import SharedMessagesPage from "@/pages/dashboard/shared/MessagesPage";
import SharedCompletedPage from "@/pages/dashboard/shared/CompletedPage";
import SharedApplicationsListPage from "@/pages/dashboard/shared/ApplicationsListPage";
import SharedPaymentsManagementPage from "@/pages/dashboard/shared/PaymentsManagementPage";
import SharedAnalyticsPage from "@/pages/dashboard/shared/AnalyticsPage";
import SharedCommissionsPage from "@/pages/dashboard/shared/CommissionsPage";
import SharedReferralsPage from "@/pages/dashboard/shared/ReferralsPage";
import PlaceholderPage from "@/pages/dashboard/placeholders/PlaceholderPage";
import DiagnosticsPage from "@/pages/dashboard/admin/DiagnosticsPage";
import SystemSettingsPage from "@/pages/dashboard/admin/SystemSettingsPage";
import { useGATracking } from "@/hooks/use-ga-tracking";
import { ReferralCapture } from "@/components/ReferralCapture";

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppInner() {
  useGATracking();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <AuthProvider>
          <ConfigProvider>
            <TooltipProvider>
              <AppInner />
              <Toaster />
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  {/* Public routes with AppShell */}
                  <Route path="/">
                    <AppShell><Home /></AppShell>
                  </Route>
                  <Route path="/login">
                    <AppShell><Login /></AppShell>
                  </Route>
                  <Route path="/register">
                    <AppShell><Register /></AppShell>
                  </Route>
                  <Route path="/packages">
                    <AppShell><Packages /></AppShell>
                  </Route>
                  <Route path="/setup">
                    <AppShell><SetupRequired /></AppShell>
                  </Route>

                  {/* Applicant Routes (Level 1+) */}
                  <Route path="/dashboard/applicant/applications/new">
                    <ProtectedRoute minLevel={1}>
                      <NewApplication />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant/registration">
                    <ProtectedRoute minLevel={1}>
                      <RegistrationPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant/documents/:applicationId/form">
                    <ProtectedRoute minLevel={1}>
                      <FormViewerPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant/documents">
                    <ProtectedRoute minLevel={1}>
                      <DocumentsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant/messages">
                    <ProtectedRoute minLevel={1}>
                      <SharedMessagesPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant/payments">
                    <ProtectedRoute minLevel={1}>
                      <PaymentsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant/settings">
                    <ProtectedRoute minLevel={1}>
                      <SharedSettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/applicant">
                    <ProtectedRoute minLevel={1}>
                      <ApplicantDashboard />
                    </ProtectedRoute>
                  </Route>

                  {/* Doctor Routes (Level 2+) */}
                  <Route path="/dashboard/doctor/reviews">
                    <ProtectedRoute minLevel={2}>
                      <SharedCompletedPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/doctor/referrals">
                    <ProtectedRoute minLevel={2}>
                      <SharedReferralsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/doctor/commissions">
                    <ProtectedRoute minLevel={2}>
                      <SharedCommissionsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/doctor/messages">
                    <ProtectedRoute minLevel={2}>
                      <SharedMessagesPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/doctor/settings">
                    <ProtectedRoute minLevel={2}>
                      <SharedSettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/doctor">
                    <ProtectedRoute minLevel={2}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  </Route>

                  {/* Redirects for old routes */}
                  <Route path="/dashboard/agent/:rest*">
                    <Redirect to="/dashboard/doctor" />
                  </Route>
                  <Route path="/dashboard/agent">
                    <Redirect to="/dashboard/doctor" />
                  </Route>
                  <Route path="/dashboard/reviewer/:rest*">
                    <Redirect to="/dashboard/doctor" />
                  </Route>
                  <Route path="/dashboard/reviewer">
                    <Redirect to="/dashboard/doctor" />
                  </Route>

                  {/* Admin Routes (Level 3+) */}
                  <Route path="/dashboard/admin/users">
                    <ProtectedRoute minLevel={3}>
                      <UsersManagement />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/packages">
                    <ProtectedRoute minLevel={3}>
                      <PackagesManagement />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/applications">
                    <ProtectedRoute minLevel={3}>
                      <SharedApplicationsListPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/payments">
                    <ProtectedRoute minLevel={3}>
                      <SharedPaymentsManagementPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/analytics">
                    <ProtectedRoute minLevel={3}>
                      <SharedAnalyticsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/reports">
                    <ProtectedRoute minLevel={3}>
                      <PlaceholderPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/messages">
                    <ProtectedRoute minLevel={3}>
                      <SharedMessagesPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/diagnostics">
                    <ProtectedRoute minLevel={3}>
                      <DiagnosticsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/system">
                    <ProtectedRoute minLevel={3}>
                      <SystemSettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin/settings">
                    <ProtectedRoute minLevel={3}>
                      <SharedSettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/admin">
                    <ProtectedRoute minLevel={3}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Route>

                  {/* Owner Routes (Level 4) */}
                  <Route path="/dashboard/owner/users">
                    <ProtectedRoute minLevel={4}>
                      <UsersManagement />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/packages">
                    <ProtectedRoute minLevel={4}>
                      <PackagesManagement />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/applications">
                    <ProtectedRoute minLevel={4}>
                      <SharedApplicationsListPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/site-settings">
                    <ProtectedRoute minLevel={4}>
                      <SiteSettings />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/settings">
                    <ProtectedRoute minLevel={4}>
                      <SharedSettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/payments">
                    <ProtectedRoute minLevel={4}>
                      <SharedPaymentsManagementPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/commissions">
                    <ProtectedRoute minLevel={4}>
                      <SharedCommissionsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/analytics">
                    <ProtectedRoute minLevel={4}>
                      <SharedAnalyticsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/diagnostics">
                    <ProtectedRoute minLevel={4}>
                      <DiagnosticsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner/system">
                    <ProtectedRoute minLevel={4}>
                      <SystemSettingsPage />
                    </ProtectedRoute>
                  </Route>
                  <Route path="/dashboard/owner">
                    <ProtectedRoute minLevel={4}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  </Route>

                  {/* Public Doctor Review Portal (no auth needed) */}
                  <Route path="/review/:token">
                    <DoctorReviewPortal />
                  </Route>

                  {/* Referral/promo code catch-all — captures /ANYCODE and pre-fills payment form */}
                  <Route path="/:referralCode">
                    <AppShell><ReferralCapture /></AppShell>
                  </Route>

                  {/* Fallback */}
                  <Route>
                    <AppShell><NotFound /></AppShell>
                  </Route>
                </Switch>
              </Suspense>
            </TooltipProvider>
          </ConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
