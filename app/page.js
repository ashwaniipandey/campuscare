"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import EmergencyModal from "@/components/EmergencyModal";
import AppointmentModal from "@/components/AppointmentModal";

export default function Home() {
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);

  const handleOpenEmergency = () => {
    setIsEmergencyOpen(true);
  };

  const handleOpenAppointment = () => {
    setIsAppointmentOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {/* Navigation Bar */}
      <Navbar
        onOpenEmergency={handleOpenEmergency}
        onOpenAppointment={handleOpenAppointment}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onOpenEmergency={handleOpenEmergency}
          onOpenAppointment={handleOpenAppointment}
        />

        {/* Features Section */}
        <div id="appointments">
          <Features
            onOpenEmergency={handleOpenEmergency}
            onOpenAppointment={handleOpenAppointment}
          />
        </div>

        {/* How It Works Section */}
        <HowItWorks
          onOpenEmergency={handleOpenEmergency}
          onOpenAppointment={handleOpenAppointment}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Emergency SOS Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

      {/* Interactive Appointment Booking Modal */}
      <AppointmentModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
      />
    </div>
  );
}
