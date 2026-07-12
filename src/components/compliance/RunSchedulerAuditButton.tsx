"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { runCronChecksAction } from "@/actions/cron.actions";
import { Play, Loader2 } from "lucide-react";

export function RunSchedulerAuditButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRunAudit = () => {
    startTransition(async () => {
      try {
        const res = await runCronChecksAction();
        if (res.success) {
          const data = res as unknown as {
            driverAlerts: number;
            documentAlerts: number;
            totalAlertsLogged: number;
          };
          alert(
            `Simulated scheduler cron completed successfully!\n` +
            `- License Alerts: ${data.driverAlerts}\n` +
            `- Document Alerts: ${data.documentAlerts}\n` +
            `Logged ${data.totalAlertsLogged} total warning events to audits & notification logs.`
          );
          router.refresh();
        } else {
          alert(res.error || "Failed to execute simulated scheduler audit.");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred during simulated audit execution.");
      }
    });
  };

  return (
    <button
      onClick={handleRunAudit}
      disabled={isPending}
      className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small disabled:opacity-60 shrink-0"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Play className="w-4 h-4 fill-current" />
      )}
      Simulate Scheduler
    </button>
  );
}
