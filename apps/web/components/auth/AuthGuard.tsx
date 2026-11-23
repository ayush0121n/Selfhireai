"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local session state
    const authRole = localStorage.getItem("selfhire_auth_role");
    const authEmail = localStorage.getItem("selfhire_auth_email");

    if (!authRole || !authEmail) {
      setIsAuthenticated(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // While checking auth, show an elegant warm loading skeleton
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FEF5E7] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#B34A0E] border-t-transparent animate-spin"></div>
        <p className="font-sans text-[13px] tracking-wide text-[#2D0E03]/70 font-medium">
          Verifying SelfHire.ai Authentication...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
