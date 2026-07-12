import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  DollarSign,
  ShieldCheck,
  Settings,
  BarChart3,
} from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { GlobalSearchBar } from "@/components/shared/GlobalSearchBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  // Define navigation items with their respective permission checks
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Fleet",
      href: "/fleet",
      icon: Truck,
      show: hasPermission(role, "VIEW_VEHICLES"),
    },
    {
      name: "Drivers",
      href: "/drivers",
      icon: Users,
      show: hasPermission(role, "VIEW_DRIVERS"),
    },
    {
      name: "Trips",
      href: "/trips",
      icon: Route,
      show: hasPermission(role, "VIEW_TRIPS"),
    },
    {
      name: "Maintenance",
      href: "/maintenance",
      icon: Wrench,
      show: hasPermission(role, "VIEW_MAINTENANCE"),
    },
    {
      name: "Fuel & Expenses",
      href: "/expenses", // Aligned with the expenses router path
      icon: DollarSign,
      show: hasPermission(role, "VIEW_FUEL_EXPENSES"),
    },
    {
      name: "Compliance",
      href: "/compliance",
      icon: ShieldCheck,
      show: hasPermission(role, "VIEW_COMPLIANCE"),
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      show: hasPermission(role, "VIEW_REPORTS"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      show: hasPermission(role, "MANAGE_SETTINGS"),
    },
  ];

  return (
    <div className="flex h-screen bg-[#F5F7FA] text-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div className="flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-2 shrink-0 bg-white">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white shadow-small">
              T
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">TransitOps</span>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 h-11 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-[8px] transition-all font-semibold text-sm group"
                  >
                    <Icon className="w-[20px] h-[20px] text-gray-400 group-hover:text-primary-500 transition-colors" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Logout Button Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F5F7FA] relative">
        {/* Top Header */}
        <header className="sticky top-0 h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <GlobalSearchBar />
          <div className="flex items-center gap-4 text-xs font-semibold px-3 py-1.5 bg-green-50 rounded-full border border-green-200 text-green-800 shadow-small">
            <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse"></span>
            System Live
          </div>
        </header>

        {/* Dashboard Pages Root */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
