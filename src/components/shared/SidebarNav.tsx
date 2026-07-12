"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  DollarSign,
  ShieldCheck,
  BarChart3,
  Settings,
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";
import { Role } from "@prisma/client";

interface SidebarNavProps {
  role: Role;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

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
      href: "/expenses",
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
    <nav className="flex-1 px-4 space-y-1.5 mt-4 text-left">
      {navItems
        .filter((item) => item.show)
        .map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 h-11 rounded-[8px] transition-all font-bold text-sm group ${
                isActive
                  ? "border border-amber-600/50 bg-amber-50/65 text-amber-700 shadow-small"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon
                className={`w-[20px] h-[20px] transition-colors ${
                  isActive ? "text-amber-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
    </nav>
  );
}
