"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Siren,
  CalendarCheck,
  HeartHandshake,
  Pill,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  PhoneForwarded,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    id: "emergency-sos",
    title: "Instant Emergency SOS Dispatch",
    badge: "Life-Saving Speed",
    badgeVariant: "destructive",
    description:
      "One-touch emergency beacon alerts campus police, on-duty student medics, and 911 dispatch with pinpoint geo-location and your medical emergency profile.",
    icon: Siren,
    iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
    hoverBorder: "hover:border-rose-200",
    gradient: "from-rose-500/10 to-transparent",
    actionLabel: "Learn Emergency Protocols",
  },
  {
    id: "appointment-scheduling",
    title: "Clinic & Specialist Appointments",
    badge: "Zero Phone Wait",
    badgeVariant: "teal",
    description:
      "Schedule appointments with university doctors, nurses, physical therapists, and sports medicine staff. Choose preferred times and receive automatic calendar sync.",
    icon: CalendarCheck,
    iconBg: "bg-teal-50 text-teal-600 border border-teal-100",
    hoverBorder: "hover:border-teal-200",
    gradient: "from-teal-500/10 to-transparent",
    actionLabel: "View Clinic Calendar",
  },
  {
    id: "mental-health",
    title: "Confidential Mental Health & Counseling",
    badge: "100% Private",
    badgeVariant: "secondary",
    description:
      "Immediate access to compassionate student counselors, licensed psychologists, stress management resources, and crisis drop-in sessions without academic disclosure.",
    icon: HeartHandshake,
    iconBg: "bg-sky-50 text-sky-600 border border-sky-100",
    hoverBorder: "hover:border-sky-200",
    gradient: "from-sky-500/10 to-transparent",
    actionLabel: "Explore Counseling",
  },
  {
    id: "pharmacy-prescriptions",
    title: "Campus Pharmacy & Fast Refills",
    badge: "On-Campus Pickup",
    badgeVariant: "teal",
    description:
      "Order prescription refills, request over-the-counter medications, allergy care, and pick up essential first-aid kits directly at the campus health pavilion.",
    icon: Pill,
    iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    hoverBorder: "hover:border-indigo-200",
    gradient: "from-indigo-500/10 to-transparent",
    actionLabel: "Access Pharmacy",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Features({ onOpenEmergency, onOpenAppointment }) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50/60 dark:bg-[#0c1424] transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="teal" className="mb-3">
            Comprehensive Medical Coverage
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-foreground tracking-tight">
            Designed for Student Health, Safety & Rapid Response
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-muted-foreground">
            A modern, unified health platform connecting students, university faculty,
            campus paramedics, and healthcare professionals in real time.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <Card
                  className={`h-full flex flex-col justify-between bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 relative overflow-hidden group ${feature.hoverBorder}`}
                >
                  {/* Subtle hover gradient in card top */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                      feature.id === "emergency-sos"
                        ? "from-rose-500 to-red-600"
                        : "from-teal-500 to-sky-500"
                    }`}
                  />

                  <div>
                    {/* Icon and Badge row */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-200 ${feature.iconBg} dark:bg-slate-800 dark:border-slate-700`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant={feature.badgeVariant} className="text-[11px] font-semibold">
                        {feature.badge}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-foreground mb-2.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Card Action Link */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (feature.id === "emergency-sos") {
                          if (role === "staff") {
                            router.push("/staff/emergencies");
                          } else if (role === "admin") {
                            router.push("/admin/emergencies");
                          } else if (role === "ambulance") {
                            router.push("/ambulance/dashboard");
                          } else if (onOpenEmergency) {
                            onOpenEmergency();
                          }
                        } else {
                          if (role === "staff") {
                            router.push("/staff/dashboard");
                          } else if (role === "admin") {
                            router.push("/admin/dashboard");
                          } else if (role === "ambulance") {
                            router.push("/ambulance/dashboard");
                          } else if (onOpenAppointment) {
                            onOpenAppointment();
                          }
                        }
                      }}
                      className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1.5 cursor-pointer group-hover:underline"
                    >
                      <span>
                        {feature.id === "emergency-sos" && role === "staff"
                          ? "View Active Emergencies"
                          : feature.id === "emergency-sos" && role === "admin"
                          ? "View Emergencies"
                          : feature.id === "emergency-sos" && role === "ambulance"
                          ? "Ambulance Console"
                          : feature.actionLabel}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom stats / assurance bar */}
        <div className="mt-12 bg-white dark:bg-card rounded-2xl border border-slate-200/90 dark:border-border p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-foreground text-sm sm:text-base">
                FERPA & HIPAA Compliant Campus Health Infrastructure
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground">
                Your medical consults, mental wellness sessions, and emergency records are encrypted and protected by strict privacy regulations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAppointment}
            className="shrink-0 text-sm font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100/80 px-4 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
          >
            Review Clinical Privacy Terms &rarr;
          </button>
        </div>

      </div>
    </section>
  );
}
