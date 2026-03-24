import { useEffect, Suspense, lazy } from "react";
import { useParams } from "wouter";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/Home"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function ReferralCapture() {
  const { referralCode } = useParams<{ referralCode: string }>();

  useEffect(() => {
    if (referralCode && referralCode.length > 0) {
      sessionStorage.setItem("referralPromoCode", referralCode.toUpperCase());
    }
  }, [referralCode]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Home />
    </Suspense>
  );
}
