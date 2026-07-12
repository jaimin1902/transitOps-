import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { getComplianceDashboard } from "@/lib/domain/driver.service";
import { CompliancePanel } from "@/components/compliance/CompliancePanel";
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Compliance Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Safety & Compliance Audit
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Monitor driver qualifications, license validities, track critical safety profiles, and handle operational suspensions.
          </p>
        </div>
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
