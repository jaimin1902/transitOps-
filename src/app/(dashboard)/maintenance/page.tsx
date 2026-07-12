import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/rbac";
import { listMaintenanceLogs, listVehiclesForMaintenance } from "@/lib/domain/maintenance.service";
import { MaintenanceTable } from "@/components/maintenance/MaintenanceTable";
import { Wrench } from "lucide-react";

export default async function MaintenancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    // RBAC Security Check
    assertPermission(session.user.role, "VIEW_MAINTENANCE");
  } catch {
    redirect("/dashboard");
  }

  // Load maintenance registers and eligible shop assets
  const [logs, eligibleVehicles] = await Promise.all([
    listMaintenanceLogs(),
    listVehiclesForMaintenance(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {/* <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider">
            <Wrench className="w-4 h-4" />
            Fleet Operations
          </div> */}
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Maintenance Workspace
          </h1>
          <p className="text-gray-500 text-sm">
            Schedule vehicle checks, register mechanical repairs, monitor ongoing shop logs, and track historical costs.
          </p>
        </div>
      </div>

      {/* Main Table Workspace */}
      <MaintenanceTable
        initialLogs={logs.map((log) => ({
          ...log,
          cost: Number(log.cost),
          vehicle: {
            ...log.vehicle,
          },
        }))}
        availableVehicles={eligibleVehicles.map((v) => ({
          id: v.id,
          registrationNumber: v.registrationNumber,
          name: v.name,
        }))}
      />
    </div>
  );
}
