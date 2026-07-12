"use client";

import React from "react";
import { User, Activity, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
}

interface RecentActivityProps {
  logs: AuditLog[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  function formatAction(action: string, entityType: string, entityId: string) {
    const shortId = entityId.substring(0, 8).toUpperCase();
    switch (action) {
      case "DISPATCH_TRIP":
        return `Dispatched trip #${shortId}`;
      case "COMPLETE_TRIP":
        return `Completed trip #${shortId}`;
      case "CANCEL_TRIP":
        return `Cancelled trip #${shortId}`;
      case "RESOLVE_MAINTENANCE":
        return `Resolved maintenance for vehicle #${shortId}`;
      case "SUSPEND_DRIVER":
        return `Suspended driver registry #${shortId}`;
      case "ALERT_DRIVER":
        return `Sent license renewal alert to driver #${shortId}`;
      default:
        return `${action.replace("_", " ")} on ${entityType.toLowerCase()}`;
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">Operational audits</h3>
        <p className="text-xs text-gray-500 mt-0.5">Timeline of system log changes and updates</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium py-10">
            No audits registered today.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-left">
                {/* Left timeline dot */}
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <Activity className="w-4 h-4 text-primary-500" />
                  </div>
                </div>

                {/* Right details */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-800">
                    {formatAction(log.action, log.entityType, log.entityId)}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      ID: {log.userId.substring(0, 6)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
