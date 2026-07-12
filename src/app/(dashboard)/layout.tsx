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
  BarChart3,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";

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
      name: "Vehicles",
      href: "/vehicles",
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
      href: "/fuel-expenses",
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
      name: "Reports & Analytics",
      href: "/reports",
      icon: BarChart3,
      show: hasPermission(role, "VIEW_REPORTS"),
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div className="flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-850 gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              T
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">TransitOps</span>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 mx-3 my-4 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-slate-200">{session.user.name}</h4>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-100 hover:bg-slate-850 rounded-xl transition-all font-medium text-sm group"
                  >
                    <Icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Logout Button Footer */}
        <div className="p-3 border-t border-slate-850">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 relative">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-850 px-8 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-200">Management Panel</h2>
          <div className="flex items-center gap-4 text-xs font-semibold px-3 py-1.5 bg-slate-850 rounded-full border border-slate-800 text-slate-400">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
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
