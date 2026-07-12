import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { getComplianceDashboard } from "@/lib/domain/driver.service";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
import { RunSchedulerAuditButton } from "@/components/compliance/RunSchedulerAuditButton";
import { ShieldCheck } from "lucide-react";

export default async function CompliancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  // Strict compliance workspace route guard (Safety & Admins only)
  if (!hasPermission(role, "VIEW_COMPLIANCE")) {
    redirect("/dashboard");
  }

  const dashboardData = await getComplianceDashboard();

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Compliance Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Safety & Compliance Audit
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Monitor driver qualifications, license validities, track critical safety profiles, and handle operational suspensions.
          </p>
        </div>

        {/* Action Controls */}
        <RunSchedulerAuditButton />
      </div>

      {/* Interactive Compliance Panel */}
      <CompliancePanel
        stats={dashboardData.stats}
        flaggedDrivers={dashboardData.flaggedDrivers.map(fd => ({
          ...fd,
          safetyScore: Number(fd.safetyScore),
        }))}
      />
    </div>
  );
}
