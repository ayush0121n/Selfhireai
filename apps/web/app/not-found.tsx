import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FEF5E7] flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-4 max-w-md">
        <span className="font-brand text-4xl font-bold tracking-tight text-[#B34A0E]">
          SelfHire<span className="text-[#2D0E03]">.ai</span>
        </span>
        <h1 className="font-display text-6xl font-bold text-[#2D0E03]">404</h1>
        <h2 className="font-display text-2xl font-bold text-[#2D0E03]">
          Page Not Found
        </h2>
        <p className="font-sans text-sm text-[#2D0E03]/70 leading-relaxed">
          The requested career intelligence resource could not be found or has been archived.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button variant="primary" className="px-6 py-2.5 text-xs">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
