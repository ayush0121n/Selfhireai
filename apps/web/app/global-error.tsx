"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Exception:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FEF5E7] text-[#2D0E03] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 text-center space-y-6 bg-white rounded-[12px] border-[0.8px] border-[#6E250A]/20 shadow-md">
          <div className="w-14 h-14 rounded-full bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center mx-auto border border-[#6E250A]/15">
            <AlertCircle className="w-7 h-7 text-[#B34A0E]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-serif text-[#2D0E03]">
              Application Error
            </h2>
            <p className="text-xs text-[#2D0E03]/70 leading-relaxed">
              {error?.message || "A client-side exception occurred. Tap below to reload the workspace safely."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-4 py-2 text-xs font-semibold rounded-[12px] bg-[#B34A0E] text-white hover:bg-[#8F3B0B] transition-colors"
            >
              Reload Application
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-[12px] border border-[#6E250A]/20 text-[#2D0E03] hover:bg-[#FEF5E7] transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
