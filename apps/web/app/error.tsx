"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for diagnostic telemetry
    console.error("SelfHire.ai Client Runtime Exception:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#FEF5E7]">
      <Card className="max-w-lg w-full p-8 text-center space-y-6 bg-white border-[0.8px] border-[#6E250A]/20 shadow-md">
        <div className="w-14 h-14 rounded-full bg-[#FEF5E7] text-[#B34A0E] flex items-center justify-center mx-auto border border-[#6E250A]/15">
          <AlertCircle className="w-7 h-7 text-[#B34A0E]" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAD7A0]/60 text-[11px] font-semibold text-[#2D0E03] uppercase tracking-wider font-sans">
            Client Safe Recovery
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#2D0E03]">
            Something unexpected occurred
          </h2>
          <p className="text-xs text-[#2D0E03]/70 font-sans max-w-sm mx-auto leading-relaxed">
            {error?.message || "An unexpected error occurred while rendering this view. Your session and vault remain secure."}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-[#2D0E03]/40">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              <Home className="w-3.5 h-3.5 text-[#B34A0E]" />
              Return to Dashboard
            </Button>
          </Link>

          <Link href="/agent" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              <Bot className="w-3.5 h-3.5 text-[#B34A0E]" />
              AI Agent
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
