import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { listDrivers } from "@/lib/domain/driver.service";
import { prisma } from "@/lib/prisma";
import { DriverTable } from "@/components/drivers/DriverTable";
import { Users } from "lucide-react";

export default async function DriversPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  // Strict page boundary enforcement
  if (!hasPermission(role, "VIEW_DRIVERS")) {
    redirect("/dashboard");
  }

  // Load drivers dataset and unlinked driver users
  const [drivers, unlinkedUsers] = await Promise.all([
    listDrivers(),
    prisma.user.findMany({
      where: {
        role: "DRIVER",
        driver: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Operations Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Driver Registry
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Manage registrations, safety scores, licensing data, and check availability profiles for active drivers.
          </p>
        </div>
      </div>

      {/* Main Interactive Table */}
      <DriverTable
        initialDrivers={drivers}
        unlinkedUsers={unlinkedUsers}
      />
    </div>
  );
}
