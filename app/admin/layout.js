import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Admin Console | CampusCare",
  description: "CampusCare Administrative Oversight and Operations Console",
};

export default function AdminLayout({ children }) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
