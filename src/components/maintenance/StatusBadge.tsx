import React from "react";
import { MaintenanceStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs: Record<MaintenanceStatus, { text: string; bg: string; textClass: string; dot: string }> = {
    OPEN: {
      text: "Active / Open",
      bg: "bg-amber-50 border border-amber-200",
      textClass: "text-amber-700",
      dot: "bg-amber-500",
    },
    CLOSED: {
      text: "Resolved / Closed",
      bg: "bg-emerald-50 border border-emerald-200",
      textClass: "text-emerald-700",
      dot: "bg-emerald-500",
    },
  };

  const config = configs[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.text}
    </span>
  );
}
