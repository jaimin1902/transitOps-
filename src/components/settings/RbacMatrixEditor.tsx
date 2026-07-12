"use client";

import React, { useState } from "react";
import { Role, RolePermission } from "@prisma/client";
import { updateRolePermissionAction } from "@/actions/settings.actions";
import { ShieldAlert, Users, CheckCircle, Loader2 } from "lucide-react";

interface RbacMatrixEditorProps {
  initialPermissions: RolePermission[];
}

const ROLES: Role[] = [
  "ADMIN",
  "FLEET_MANAGER",
  "DISPATCHER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];

const MODULES = [
  { key: "fleet", label: "Fleet Management" },
  { key: "drivers", label: "Driver registry" },
  { key: "trips", label: "Trip Dispatcher" },
  { key: "maintenance", label: "Service Logs" },
  { key: "fuel_expenses", label: "Fuel & Expenses" },
  { key: "analytics", label: "Reports/Analytics" },
  { key: "compliance", label: "Compliance Panel" },
  { key: "settings", label: "System Settings" },
];

export function RbacMatrixEditor({ initialPermissions }: RbacMatrixEditorProps) {
  const [permissions, setPermissions] = useState<RolePermission[]>(initialPermissions);
  const [updatingCell, setUpdatingCell] = useState<{ role: Role; module: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getPermissionAccess = (role: Role, module: string): string => {
    // ADMIN overrides all to edit access
    if (role === "ADMIN") return "edit";
    const record = permissions.find((p) => p.role === role && p.module === module);
    return record?.access || "none";
  };

  const handleAccessChange = async (role: Role, module: string, newAccess: string) => {
    if (role === "ADMIN") return; // Admin permissions cannot be modified
    setUpdatingCell({ role, module });
    setFeedback(null);

    try {
      const res = await updateRolePermissionAction(role, module, newAccess);
      if (res.success) {
        setPermissions((prev) => {
          const index = prev.findIndex((p) => p.role === role && p.module === module);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = res.data as RolePermission;
            return updated;
          } else {
            return [...prev, res.data as RolePermission];
          }
        });
        setFeedback(`Permissions for ${role.replace("_", " ")} - ${module} updated successfully.`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        alert(res.error || "Failed to update permissions.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setUpdatingCell(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-150">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary-500" />
          <h3 className="text-base font-bold text-gray-900">Role-Based Access Control (RBAC) Matrix</h3>
        </div>
      </div>

      <div className="p-4 bg-primary-50 border border-primary-150 rounded-card flex gap-3 text-sm text-primary-800">
        <Users className="w-5 h-5 shrink-0 text-primary-600 mt-0.5" />
        <div>
          <p className="font-bold">Matrix Configuration Guidelines</p>
          <p className="text-xs text-primary-700 mt-1">
            • <strong>Edit:</strong> Read & write operations (Create, Update, Resolve, Delete).<br />
            • <strong>View:</strong> Read-only access to registry lists and detail pages.<br />
            • <strong>None:</strong> Route is fully restricted and hidden from navigation.<br />
            • <strong>Admin:</strong> Hardcoded to full Edit access system-wide.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs rounded-input font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/40 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Security Role</th>
                {MODULES.map((m) => (
                  <th key={m.key} className="px-5 py-4 text-center">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {ROLES.map((role) => (
                <tr key={role} className="hover:bg-gray-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 tracking-tight">
                      {role.replace("_", " ")}
                    </span>
                  </td>
                  {MODULES.map((m) => {
                    const access = getPermissionAccess(role, m.key);
                    const isUpdating = updatingCell?.role === role && updatingCell?.module === m.key;
                    const isAdmin = role === "ADMIN";

                    return (
                      <td key={m.key} className="px-5 py-4">
                        <div className="flex items-center justify-center">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                          ) : isAdmin ? (
                            <span className="px-2.5 py-1 rounded bg-gray-100 text-[10px] font-extrabold text-gray-500 uppercase">
                              Edit (Locked)
                            </span>
                          ) : (
                            <select
                              value={access}
                              onChange={(e) => handleAccessChange(role, m.key, e.target.value)}
                              className="h-8 text-xs font-semibold px-2 bg-white border border-gray-300 text-gray-700 rounded-input focus:outline-none focus:border-primary-500 cursor-pointer select-arrow pr-6 relative"
                            >
                              <option value="none">None</option>
                              <option value="view">View Only</option>
                              <option value="edit">Edit / Manage</option>
                            </select>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
