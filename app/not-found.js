import Link from "next/link";
import { HeartPulse, ArrowLeft, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "404 - Page Not Found | CampusCare",
  description: "The requested campus health service page could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-slate-50 flex flex-col justify-center items-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
          <HeartPulse className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-teal-100 text-teal-800 tracking-wider">
            404 Error
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            The clinical portal resource or directory page you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 gap-2">
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full text-slate-700 hover:text-teal-700 text-xs h-10 gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Sign In</span>
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          Campus Health Services &amp; Emergency Dispatch Coordination Platform
        </p>
      </div>
    </div>
  );
}
