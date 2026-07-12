import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/rbac";
import {
  getTripsReport,
  getMonthlyRevenueChart,
  getTopCostliestVehicles,
  getRoiReport,
} from "@/lib/domain/report.service";
import { listVehicles } from "@/lib/domain/vehicle.service";
import { ReportWorkspace } from "@/components/reports/ReportWorkspace";
import { FinancialDashboard } from "@/components/analytics/FinancialDashboard";
import { AnalyticsWorkspace } from "@/components/analytics/AnalyticsWorkspace";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    // RBAC Security Check
    assertPermission(session.user.role, "VIEW_REPORTS");
  } catch {
    redirect("/dashboard");
  }

  // Load audit report dataset (all time) to pre-populate workspace
  // and load financial roi metrics & lists
  const [
    tripsData,
    monthlyRevenue,
    topCostliest,
    roiReport,
    vehicles,
  ] = await Promise.all([
    getTripsReport(),
    getMonthlyRevenueChart(),
    getTopCostliestVehicles(5),
    getRoiReport(),
    listVehicles(),
  ]);

  return (
    <AnalyticsWorkspace
      reportWorkspace={
        <ReportWorkspace
          initialData={tripsData.map((t) => ({
            ...t,
          }))}
          initialType="trips"
        />
      }
      financialDashboard={
        <FinancialDashboard
          vehiclesList={vehicles.map((v) => ({
            id: v.id,
            name: v.name,
            registrationNumber: v.registrationNumber,
          }))}
          topCostliest={topCostliest}
          monthlyRevenue={monthlyRevenue}
          roiReport={roiReport}
        />
      }
    />
  );
}
