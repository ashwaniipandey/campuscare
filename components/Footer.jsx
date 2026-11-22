import Link from "next/link";
import {
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-[#070d18] text-slate-300 pt-16 pb-12 border-t border-slate-800 dark:border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Emergency Hotline Banner inside Footer */}
        <div className="bg-rose-950/70 border border-rose-800/80 rounded-2xl p-5 mb-14 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-900/80 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-200">
                24-Hour Campus Emergency Medical Hotline
              </p>
              <p className="text-xs text-rose-300/80">
                For immediate life-threatening situations on university grounds, call dispatch now.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:555019911"
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Campus SOS: (555) 019-911</span>
            </a>
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors"
            >
              <span>Dial 911</span>
            </a>
          </div>
        </div>

        {/* 4 Columns Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                CampusCare
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Campus Health Services Scheduling & Rapid Emergency Response Coordination Platform. Empowering student well-being and campus safety 24/7.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Accredited University Health Facility</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Healthcare Services
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#appointments" className="hover:text-teal-400 transition-colors">
                  General Medicine Clinic
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-teal-400 transition-colors">
                  Mental Wellness & Counseling
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-teal-400 transition-colors">
                  Sports Injury & Physical Therapy
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-teal-400 transition-colors">
                  Pharmacy & Immunization
                </a>
              </li>
              <li>
                <a href="#emergency" className="hover:text-rose-400 transition-colors">
                  Emergency Medical Protocols
                </a>
              </li>
            </ul>
          </div>

          {/* Clinic Hours & Locations */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Hours & Locations
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Main Health Center:</p>
                  <p className="text-xs">Mon – Fri: 8:00 AM – 8:00 PM</p>
                  <p className="text-xs">Sat – Sun: 10:00 AM – 4:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Emergency Response:</p>
                  <p className="text-xs text-teal-400 font-medium">24/7 / 365 Days On-Call</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Campus Health Center
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Student Health Pavilion, Building 14</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Appointments: (555) 019-CARE</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>healthservices@university.edu</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p>&copy; {new Date().getFullYear()} CampusCare. All rights reserved.</p>
            <p className="text-[11px] text-amber-400/90 mt-1">
              Safety Note: This is a campus project. In a life-threatening emergency, call your local emergency number (112 in India) immediately.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">
              Privacy Policy &amp; Health Records
            </span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">
              FERPA Rights
            </span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">
              Accessibility
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
