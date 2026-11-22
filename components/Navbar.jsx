"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  AlertTriangle,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Calendar,
  FileText,
  Truck,
  UserCircle,
  ChevronDown,
  Home,
  Stethoscope,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import EmergencyModal from "@/components/EmergencyModal";

export default function Navbar({ onOpenEmergency, onOpenAppointment }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const dropdownRef = useRef(null);

  const handleEmergencyClick = () => {
    if (onOpenEmergency) {
      onOpenEmergency();
    } else {
      setShowEmergencyModal(true);
    }
  };

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
    setMobileMenuOpen(false);
  }, [pathname]);

  // Rule: Do NOT render this global Navbar on /staff/* and /admin/* routes
  if (pathname?.startsWith("/staff") || pathname?.startsWith("/admin")) {
    return null;
  }

  const role = session?.user?.role;

  const getDashboardUrl = () => {
    if (!role) return "/student/dashboard";
    if (role === "admin") return "/admin/dashboard";
    if (role === "staff") return "/staff/dashboard";
    if (role === "ambulance") return "/ambulance/dashboard";
    return "/student/dashboard";
  };

  // Center navigation items based on role
  let navItems = [];
  if (status !== "authenticated" || !role) {
    navItems = [
      { name: "Home", href: "/#hero", icon: Home },
      { name: "Services", href: "/#features", icon: Stethoscope },
      { name: "How It Works", href: "/#how-it-works", icon: Activity },
      {
        name: "Book Appointment",
        href: "/#appointments",
        icon: Calendar,
        onClick: (e) => {
          if (onOpenAppointment) {
            e.preventDefault();
            onOpenAppointment();
          }
        },
      },
    ];
  } else if (role === "student") {
    navItems = [
      { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { name: "Book Appointment", href: "/student/book", icon: PlusCircle },
      { name: "My Appointments", href: "/student/appointments", icon: Calendar },
      { name: "My Reports", href: "/student/reports", icon: FileText },
    ];
  } else if (role === "ambulance") {
    navItems = [
      { name: "Dashboard", href: "/ambulance/dashboard", icon: Truck },
    ];
  }

  // SOS button is for students and logged-out visitors only
  const showSosButton = !session || role === "student";

  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "Account";
  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-16 bg-white/85 dark:bg-[#0b1220]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                CampusCare
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="hidden xl:inline text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider -mt-0.5">
              Health &amp; Emergency
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={item.onClick}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Notification Bell (for logged in users) */}
          {status === "authenticated" && <NotificationBell />}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* SOS Button: students and visitors only */}
          {showSosButton && (
            <Button
              variant="emergency"
              size="sm"
              onClick={handleEmergencyClick}
              className="h-9 px-3 gap-1.5 font-bold tracking-wide shadow-sm"
              title="Emergency SOS Dispatch"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS</span>
            </Button>
          )}

          {/* Logged in User Menu */}
          {status === "authenticated" && session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 transition-colors"
                aria-label="User menu"
              >
                <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate leading-tight">
                    {firstName}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-teal-600 dark:text-teal-400">
                    {role || "user"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-white/10 shadow-xl py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {session.user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {session.user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href={getDashboardUrl()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-teal-600" />
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-sky-600" />
                        <span>My Profile</span>
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
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-9 text-xs font-semibold">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-9 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0b1220] px-4 py-4 space-y-3 shadow-lg"
          >
            {/* User status card if logged in */}
            {status === "authenticated" && session?.user && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#111a2e] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {session.user.name}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 capitalize">
                      Role: {role}
                    </p>
                  </div>
                </div>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Dashboard →
                </Link>
              </div>
            )}

            {/* Links list */}
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (item.onClick) item.onClick(e);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Logged-out buttons on mobile */}
            {status !== "authenticated" && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Logged in log out button on mobile */}
            {status === "authenticated" && (
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1.5"
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>

    {showEmergencyModal && (
      <EmergencyModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />
    )}
  </>
  );
}
