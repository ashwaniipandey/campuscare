import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Staff Portal | CampusCare",
  description: "CampusCare Healthcare Clinicians and Staff Portal",
};

export default function StaffLayout({ children }) {
  return <DashboardShell role="staff">{children}</DashboardShell>;
}
