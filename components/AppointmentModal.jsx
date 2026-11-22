"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  X,
  CheckCircle2,
  Stethoscope,
  Heart,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const departments = [
  { id: "general", name: "General Medicine & Flu Clinic", icon: Stethoscope },
  { id: "mental", name: "Counseling & Mental Wellness", icon: Heart },
  { id: "sports", name: "Sports Therapy & Physiotherapy", icon: Activity },
  { id: "routine", name: "Routine Physical & Immunization", icon: CheckCircle2 },
];

const timeSlots = ["09:00 AM", "10:30 AM", "01:15 PM", "02:45 PM", "04:00 PM"];

export default function AppointmentModal({ isOpen, onClose }) {
  const [selectedDept, setSelectedDept] = useState("general");
  const [selectedSlot, setSelectedSlot] = useState("10:30 AM");
  const [date, setDate] = useState("Tomorrow");
  const [reason, setReason] = useState("");
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen) return null;

  const handleBook = (e) => {
    e.preventDefault();
    setIsBooked(true);
  };

  const handleReset = () => {
    setIsBooked(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Book Campus Health Visit</h3>
                <p className="text-xs text-teal-100">Student & Staff Clinic Scheduling</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!isBooked ? (
              <form onSubmit={handleBook} className="space-y-4">
                {/* Department Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Healthcare Service:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map((dept) => {
                      const Icon = dept.icon;
                      const active = selectedDept === dept.id;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => setSelectedDept(dept.id)}
                          className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                            active
                              ? "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${active ? "text-teal-600" : "text-slate-400"}`} />
                          <span className="truncate">{dept.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Slots */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Choose Time Slot:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason / Symptoms input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reason for Visit (Confidential):
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Seasonal cold, sprained ankle from gym, prescription renewal..."
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold h-11"
                >
                  Confirm Appointment
                </Button>
                <p className="text-[11px] text-center text-slate-400">
                  Free for enrolled university students. Covered under Student Health Services.
                </p>
              </form>
            ) : (
              /* Success State */
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">
                    Appointment Scheduled!
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Your appointment has been reserved with the campus medical center.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Service:</span>
                    <span className="font-bold text-slate-900 capitalize">
                      {departments.find((d) => d.id === selectedDept)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date & Time:</span>
                    <span className="font-bold text-teal-700">Tomorrow at {selectedSlot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-bold text-slate-900">Student Health Pavilion, Suite 104</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-bold text-slate-900">APT-2026-4491</span>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
