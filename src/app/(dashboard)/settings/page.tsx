import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { getSettings, getRolePermissions } from "@/lib/domain/settings.service";
import { OrgSettingsForm } from "@/components/settings/OrgSettingsForm";
import { RbacMatrixEditor } from "@/components/settings/RbacMatrixEditor";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  // Strict page permission check
  if (!hasPermission(role, "MANAGE_SETTINGS")) {
    redirect("/dashboard");
  }

  // Load current settings and permissions
  const [settings, permissions] = await Promise.all([
    getSettings(),
    getRolePermissions(),
  ]);

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex items-center justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            Administration Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            System & Security Settings
          </h1>
          <p className="text-gray-500 text-sm">
            Manage organization details, localization preferences, and customize role-based permission profiles dynamically.
          </p>
        </div>
      </div>

      {/* Org settings container card */}
      <div className="bg-white border border-gray-200 rounded-card p-6 shadow-small">
        <OrgSettingsForm initialSettings={settings} />
      </div>

      {/* RBAC editor matrix */}
      <div className="bg-white border border-gray-200 rounded-card p-6 shadow-small">
        <RbacMatrixEditor initialPermissions={permissions} />
      </div>
    </div>
  );
}
