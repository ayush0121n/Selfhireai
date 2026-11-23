import type { Metadata } from "next";
import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "SelfHire.ai — Autonomous Career Agent OS",
  description: "AI-powered job discovery, truthful ATS resume tailoring, smart form autofill, and exact approval gate.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-canvas-warm text-text-primary antialiased min-h-screen flex flex-col justify-between font-sans"
        suppressHydrationWarning
      >
        <div className="flex-1 w-full">
          {children}
        </div>
        <div className="w-full">
          <HalftoneWordmarkFooter />
        </div>
      </body>
    </html>
  );
}
