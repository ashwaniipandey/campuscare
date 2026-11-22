"use client";

import Navbar from "@/components/Navbar";

export default function StudentLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
      <Navbar />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
