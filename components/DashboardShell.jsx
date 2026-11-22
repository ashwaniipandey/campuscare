"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarClock,
  ArrowRightLeft,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Stethoscope,
  Truck,
  ShieldAlert,
  Menu,
  X,
  ExternalLink,
  LogOut,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";

const TITLE_MAP = {
  "/staff/dashboard": "Staff Dashboard",
  "/staff/appointments": "Patient Appointments",
  "/staff/patients": "Patient Records Lookup",
  "/staff/availability": "My Availability Schedule",
  "/staff/referrals": "Clinical Referrals & Handover",
  "/staff/emergencies": "Live Campus Emergencies",
  "/staff/performance": "My Performance & Reviews",
  "/admin/dashboard": "Admin Operations Dashboard",
  "/admin/analytics": "Analytics & Performance Metrics",
  "/admin/users": "User Access & Roles",
  "/admin/doctors": "Doctor Roster & Duty Status",
  "/admin/ambulances": "Ambulance Fleet Console",
  "/admin/appointments": "All Campus Appointments",
  "/admin/emergencies": "Emergency Response Console",
  "/admin/referrals": "Referrals Audit Log",
  "/admin/access-logs": "Medical Access Logs",
};

export default function DashboardShell({ children, role: forcedRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const role = forcedRole || (pathname?.startsWith("/admin") ? "admin" : "staff");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Badge counts
  const [pendingReferralsCount, setPendingReferralsCount] = useState(0);
  const [activeEmergencyCount, setActiveEmergencyCount] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Poll badges every 15s
  const fetchBadgeCounts = useCallback(async () => {
    try {
      const promises = [
        fetch("/api/emergencies/active", { cache: "no-store" }),
      ];

      if (role === "staff") {
        promises.push(fetch("/api/referrals/incoming", { cache: "no-store" }));
      }

      const results = await Promise.all(promises);

      if (results[0]?.ok) {
        const emgData = await results[0].json();
        const newCount = (emgData.emergencies || []).filter((e) => e.status === "new").length;
        setActiveEmergencyCount(newCount);
      }

      if (role === "staff" && results[1]?.ok) {
        const refData = await results[1].json();
        const pendingCount = (refData.referrals || []).filter((r) => r.status === "pending").length;
        setPendingReferralsCount(pendingCount);
      }
    } catch (e) {
      // Background polling error ignored
    }
  }, [role]);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  const pageTitle = TITLE_MAP[pathname] || (role === "admin" ? "Admin Console" : "Staff Portal");

  // Staff Navigation Structure
  const staffSections = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
        { label: "Appointments", href: "/staff/appointments", icon: ClipboardList },
        { label: "Patients", href: "/staff/patients", icon: Users },
        { label: "My Availability", href: "/staff/availability", icon: CalendarClock },
      ],
    },
    {
      title: "Care & Operations",
      items: [
        {
          label: "Referrals",
          href: "/staff/referrals",
          icon: ArrowRightLeft,
          badge: pendingReferralsCount > 0 ? pendingReferralsCount : null,
          badgeVariant: "blue",
        },
        {
          label: "Emergencies",
          href: "/staff/emergencies",
          icon: AlertTriangle,
          badge: activeEmergencyCount > 0 ? activeEmergencyCount : null,
          badgeVariant: "red",
        },
        { label: "My Performance", href: "/staff/performance", icon: TrendingUp },
      ],
    },
  ];

  // Admin Navigation Structure
  const adminSections = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "User Access", href: "/admin/users", icon: Users },
        { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
        { label: "Ambulances", href: "/admin/ambulances", icon: Truck },
        { label: "Appointments", href: "/admin/appointments", icon: ClipboardList },
      ],
    },
    {
      title: "Safety & Audit",
      items: [
        {
          label: "Emergencies",
          href: "/admin/emergencies",
          icon: AlertTriangle,
          badge: activeEmergencyCount > 0 ? activeEmergencyCount : null,
          badgeVariant: "red",
        },
        { label: "Referrals", href: "/admin/referrals", icon: ArrowRightLeft },
        { label: "Access Logs", href: "/admin/access-logs", icon: ShieldAlert },
      ],
    },
  ];

  const sections = role === "admin" ? adminSections : staffSections;

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role === "admin"
    ? "AD"
    : "ST";

  const staffId = session?.user?.staffId;

  // Sidebar content component (used in desktop fixed bar & mobile drawer)
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#111a2e] text-slate-800 dark:text-slate-200">
      {/* Brand logo */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                CampusCare
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {role === "admin" ? "Admin Console" : "Staff Portal"}
            </span>
          </div>
        </Link>
      </div>

      {/* Nav section list */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {sec.title}
            </p>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800/80 shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold shrink-0 ${
                          item.badgeVariant === "red"
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom user card */}
      <div className="p-4 border-t border-slate-200/80 dark:border-white/10 shrink-0 space-y-2 bg-slate-50/50 dark:bg-[#0b1220]/40">
        <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200/80 dark:border-white/10">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
              {session?.user?.name || (role === "admin" ? "Administrator" : "Staff Member")}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {staffId ? `ID: ${staffId}` : session?.user?.email || role}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <Link
            href="/"
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220] flex transition-colors">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:block w-[260px] h-screen sticky top-0 shrink-0 border-r border-slate-200/80 dark:border-white/10 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 w-[270px] z-50 shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-[#0b1220]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Page Title */}
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ThemeToggle />

            {/* User Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitials}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                  {session?.user?.name?.split(" ")[0] || "Me"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-white/10 shadow-xl py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {session?.user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-teal-600" />
                        <span>Profile Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-1">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
