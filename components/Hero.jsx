"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  AlertOctagon,
  ShieldCheck,
  Clock,
  MapPin,
  Activity,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Hero({ onOpenEmergency, onOpenAppointment }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  return (
    <section id="hero" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-background transition-colors">
      {/* Soft background medical glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-50/70 via-sky-50/40 to-transparent dark:from-teal-950/20 dark:via-sky-950/10 pointer-events-none -z-10 rounded-full blur-3xl opacity-70" />
      <div className="absolute -top-24 right-0 w-80 h-80 bg-teal-100/40 dark:bg-teal-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 -left-20 w-80 h-80 bg-sky-100/30 dark:bg-sky-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Subtext, CTAs */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-start text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Safety Notice Callout Banner */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-4 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300 shadow-xs"
            >
              <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Safety Notice:</strong> This is a campus project. In a life-threatening emergency, call your local emergency number (<strong>112 in India</strong>) immediately.
              </span>
            </motion.div>

            {/* Live Campus Health Status Pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs sm:text-sm font-medium mb-6 shadow-sm"
            >
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
              </span>
              <span>Campus Health Scheduling &amp; On-Call Emergency Alerts</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-foreground tracking-tight leading-[1.15]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Campus Health Scheduling &{" "}
              <span className="bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                Emergency Response
              </span>{" "}
              Platform
            </motion.h1>

            {/* Subtext */}
            <motion.p
              className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-muted-foreground leading-relaxed max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Instantly book campus clinic appointments, access confidential mental
              wellness counseling, and trigger one-touch geo-located emergency medical
              dispatch anywhere on campus.
            </motion.p>

            {/* Call to Actions */}
            <motion.div
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {role === "staff" ? (
                <>
                  <Link href="/staff/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 text-base h-13 px-8 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Staff Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/staff/emergencies">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 font-bold text-base h-13 px-8 border-rose-500/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Active Emergencies</span>
                    </Button>
                  </Link>
                </>
              ) : role === "admin" ? (
                <>
                  <Link href="/admin/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 text-base h-13 px-8 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Admin Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/admin/emergencies">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 font-bold text-base h-13 px-8 border-rose-500/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Emergencies</span>
                    </Button>
                  </Link>
                </>
              ) : role === "ambulance" ? (
                <>
                  <Link href="/ambulance/dashboard">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 text-base h-13 px-8 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Ambulance Dashboard</span>
                    </Button>
                  </Link>
                  <Link href="/ambulance/dashboard">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto gap-2.5 font-bold text-base h-13 px-8 border-rose-500/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Ambulance Console</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* Primary: Book Appointment */}
                  <Button
                    size="lg"
                    onClick={onOpenAppointment}
                    className="gap-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/20 text-base h-13 px-8 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Book Appointment</span>
                  </Button>

                  {/* Red Emergency SOS Button */}
                  <Button
                    variant="emergency"
                    size="lg"
                    onClick={onOpenEmergency}
                    className="gap-2.5 font-bold text-base h-13 px-8 text-white transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <AlertOctagon className="w-5 h-5 animate-spin-slow" />
                    <span>EMERGENCY SOS</span>
                  </Button>
                </>
              )}
            </motion.div>

            {/* Mini Trust Highlights */}
            <motion.div
              className="mt-10 pt-8 border-t border-slate-100 dark:border-border flex flex-wrap items-center gap-y-3 gap-x-6 text-xs sm:text-sm text-slate-500 dark:text-muted-foreground font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Fast emergency alerts to on-call staff</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Confidential student health records</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Direct campus medical dispatch link</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Live Medical Dashboard Card Preview */}
          <motion.div
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            {/* Soft decorative glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-400/10 via-sky-400/15 to-transparent rounded-3xl blur-2xl -z-10" />

            <div className="relative bg-white dark:bg-card rounded-3xl border border-slate-200/80 dark:border-border shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-7 backdrop-blur-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100/70 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-foreground text-sm sm:text-base">
                      Campus Triage & Care
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-muted-foreground">Real-Time Readiness</p>
                  </div>
                </div>
                <Badge variant="success" className="gap-1 px-2.5 py-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Active Now
                </Badge>
              </div>

              {/* Status List */}
              <div className="mt-5 space-y-3.5">
                {/* Status Item 1: Emergency Quick Beacon */}
                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100/80 dark:border-rose-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-950 dark:text-rose-200">
                        Rapid Emergency Dispatch
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        Paramedic units stationed at North & South Quad
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 px-2 py-1 rounded-md shadow-xs border border-rose-200 dark:border-rose-900/60">
                    Ready
                  </span>
                </div>

                {/* Status Item 2: Walk-in & Scheduled Clinic */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-foreground">
                        Main Health Center (Hall B)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                        Current Wait Time: ~10 mins
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded-md border border-teal-100 dark:border-teal-800">
                    4 Doctors In
                  </span>
                </div>

                {/* Status Item 3: Mental Health Counseling */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-100 dark:border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-foreground">
                        Counseling & Crisis Line
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                        Confidential 1-on-1 virtual or in-person
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-1 rounded-md border border-sky-100 dark:border-sky-800">
                    Open
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action inside card */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-muted-foreground">University Medical Center</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAppointment}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                >
                  View Schedule &rarr;
                </button>
              </div>
            </div>

            {/* Floating metric badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="hidden sm:flex absolute -bottom-6 -left-6 bg-white dark:bg-card rounded-2xl p-3.5 border border-slate-200/90 dark:border-border shadow-lg items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-foreground">10,000+ Students</p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Protected Campus-Wide</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
