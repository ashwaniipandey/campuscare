"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Smartphone,
  Stethoscope,
  HeartPulse,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    title: "Request Visit or Tap SOS",
    subtitle: "Under 30 Seconds",
    description:
      "Choose a specialized health service from your student portal or hit the Emergency SOS button in critical situations with automatic GPS building detection.",
    icon: Smartphone,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-50 border-teal-100",
  },
  {
    step: "02",
    title: "Instant Triage & Dispatch",
    subtitle: "Automated Coordination",
    description:
      "Our smart triage engine instantly routes appointment slots to doctors or dispatches nearest campus responders and campus safety officers to your exact location.",
    icon: Zap,
    iconColor: "text-sky-600",
    iconBg: "bg-sky-50 border-sky-100",
  },
  {
    step: "03",
    title: "Receive On-Campus Care & Follow-Up",
    subtitle: "Personalized Recovery",
    description:
      "Meet your healthcare provider at the clinic or receive emergency care on scene. Get digital prescriptions, lab results, and follow-ups delivered directly to your profile.",
    icon: HeartPulse,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-100",
  },
];

export default function HowItWorks({ onOpenAppointment, onOpenEmergency }) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isStudentOrVisitor = !session || role === "student";
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white dark:bg-background relative overflow-hidden transition-colors">
      {/* Decorative background radial pattern */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-50/50 dark:bg-teal-950/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <Badge variant="teal" className="mb-3">
            Streamlined Process
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-foreground tracking-tight">
            How CampusCare Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-muted-foreground">
            From routine physicals to urgent medical alerts, accessing healthcare on campus has never been faster or easier.
          </p>
        </div>

        {/* 3 Steps Roadmap */}
        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-28 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-teal-200 via-sky-200 to-emerald-200 dark:from-teal-900/40 dark:via-sky-900/40 dark:to-emerald-900/40 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative z-10">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: idx * 0.15, duration: 0.5, ease: "easeOut" }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white dark:bg-card rounded-3xl p-7 border border-slate-200/90 dark:border-border shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Step Number & Icon Row */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-3xl font-extrabold text-slate-300 dark:text-slate-600 font-mono">
                        {item.step}
                      </span>
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xs ${item.iconBg} dark:bg-slate-800 dark:border-slate-700`}
                      >
                        <Icon className={`w-7 h-7 ${item.iconColor}`} />
                      </div>
                    </div>

                    {/* Step Subtitle / Tag */}
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {item.subtitle}
                    </span>

                    {/* Step Title */}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-foreground mt-1 mb-3">
                      {item.title}
                    </h3>

                    {/* Step Description */}
                    <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Step Footer mini badge */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Step {idx + 1} of 3 in care protocol</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Interactive CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 sm:mt-20 bg-gradient-to-r from-teal-700 via-teal-800 to-sky-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/50 text-teal-100 text-xs font-medium mb-3 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Health At Your Fingertips</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to take charge of your health?
            </h3>
            <p className="mt-2 text-teal-100/90 text-sm sm:text-base leading-relaxed">
              Book a routine wellness check, schedule sports rehabilitation, or connect with counseling in just a few clicks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            {role === "staff" ? (
              <Link href="/staff/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-teal-900 hover:bg-teal-50 font-bold px-7 h-12 shadow-md cursor-pointer"
                >
                  Staff Dashboard
                </Button>
              </Link>
            ) : role === "admin" ? (
              <Link href="/admin/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-teal-900 hover:bg-teal-50 font-bold px-7 h-12 shadow-md cursor-pointer"
                >
                  Admin Dashboard
                </Button>
              </Link>
            ) : role === "ambulance" ? (
              <Link href="/ambulance/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-teal-900 hover:bg-teal-50 font-bold px-7 h-12 shadow-md cursor-pointer"
                >
                  Ambulance Console
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={onOpenAppointment}
                  className="bg-white text-teal-900 hover:bg-teal-50 font-bold px-7 h-12 shadow-md w-full sm:w-auto cursor-pointer"
                >
                  Book an Appointment
                </Button>
                {isStudentOrVisitor && (
                  <Button
                    variant="emergency"
                    size="lg"
                    onClick={onOpenEmergency}
                    className="font-bold px-6 h-12 w-full sm:w-auto cursor-pointer"
                  >
                    Emergency SOS
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
