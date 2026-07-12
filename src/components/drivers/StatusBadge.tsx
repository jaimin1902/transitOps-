import React from "react";
import { DriverStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: DriverStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs: Record<DriverStatus, { text: string; bg: string; textClass: string; dot: string }> = {
    AVAILABLE: {
      text: "Available",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      textClass: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    ON_TRIP: {
      text: "On Trip",
      bg: "bg-indigo-500/10 border-indigo-500/20",
      textClass: "text-indigo-400",
      dot: "bg-indigo-400",
    },
    OFF_DUTY: {
      text: "Off Duty",
      bg: "bg-slate-500/10 border-slate-500/20",
      textClass: "text-slate-400",
      dot: "bg-slate-400",
    },
    SUSPENDED: {
      text: "Suspended",
      bg: "bg-rose-500/10 border-rose-500/20",
      textClass: "text-rose-400",
      dot: "bg-rose-400",
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
