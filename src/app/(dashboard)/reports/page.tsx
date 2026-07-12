import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/rbac";
import { getTripsReport } from "@/lib/domain/report.service";
import { ReportWorkspace } from "@/components/reports/ReportWorkspace";
import { BarChart3 } from "lucide-react";

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

  // Load default trips report logs (all time) to pre-populate workspace
  const tripsData = await getTripsReport();

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-sm uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            Audit Hub
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Reports & CSV export
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Generate custom audit reports, apply date-range filters, review metrics details, and download spreadsheets.
          </p>
        </div>
      </div>

      {/* Interactive Report Workspace */}
      <ReportWorkspace
        initialData={tripsData.map((t) => ({
          ...t,
        }))}
        initialType="trips"
      />
    </div>
  );
}
