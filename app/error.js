"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-slate-50 flex flex-col justify-center items-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/90 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-100 text-rose-800 tracking-wider">
            System Error
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Unexpected Condition Encountered
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Our campus health telemetry encountered an error while processing this view. You can reload the page or return to the main dashboard.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100 truncate">
              {error.message}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full text-slate-700 hover:text-teal-700 text-xs h-10 gap-2">
              <Home className="w-4 h-4" />
              <span>Campus Home</span>
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          CampusCare Emergency Triage &amp; Clinical Response
        </p>
      </div>
    </div>
  );
}
