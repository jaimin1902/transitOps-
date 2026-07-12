"use client";

import React, { useState } from "react";
import { DriverStatus } from "@prisma/client";
import { suspendDriverAction, sendComplianceReminderAction } from "@/actions/driver.actions";
import {
  ShieldAlert,
  AlertTriangle,
  Mail,
  UserX,
  CheckCircle,
  Loader2,
  Users,
  Compass,
} from "lucide-react";

interface FlaggedDriver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  flags: string[];
  isCompliant: boolean;
}

interface ComplianceDashboardProps {
  stats: {
    totalDrivers: number;
    compliantDrivers: number;
    complianceRate: number;
    expiredLicenses: number;
    expiringSoonLicenses: number;
    criticalSafetyScores: number;
    suspendedDrivers: number;
  };
  flaggedDrivers: FlaggedDriver[];
}

export function CompliancePanel({ stats, flaggedDrivers }: ComplianceDashboardProps) {
  const [dataList, setDataList] = useState<FlaggedDriver[]>(flaggedDrivers);
  const [loadingDriverId, setLoadingDriverId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "remind" | null>(null);

  const handleSuspend = async (driverId: string) => {
    if (!confirm("Confirm suspending this driver registry? They will be blocked from trips.")) {
      return;
    }

    setLoadingDriverId(driverId);
    setActionType("suspend");

    try {
      const res = await suspendDriverAction(driverId);
      if (res.success) {
        setDataList((prev) =>
          prev.map((d) => (d.id === driverId ? { ...d, status: DriverStatus.SUSPENDED, flags: [...d.flags.filter(f => f !== "DRIVER_SUSPENDED"), "DRIVER_SUSPENDED"] } : d))
        );
        alert("Driver has been suspended successfully.");
      } else {
        alert(res.error || "Failed to suspend driver.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during suspension.");
    } finally {
      setLoadingDriverId(null);
      setActionType(null);
    }
  };

  const handleSendReminder = async (driverId: string) => {
    setLoadingDriverId(driverId);
    setActionType("remind");

    try {
      const res = await sendComplianceReminderAction(driverId);
      if (res.success) {
        alert("Compliance alert notification logged successfully for this driver!");
      } else {
        alert(res.error || "Failed to log compliance alert.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while logging alert.");
    } finally {
      setLoadingDriverId(null);
      setActionType(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Compliance Rate Card */}
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden group shadow-xl">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Compliance Rate</span>
            <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.complianceRate.toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-medium">compliant</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.complianceRate}%` }}
            ></div>
          </div>
        </div>

        {/* Expired Licenses */}
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden group shadow-xl">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expired Licenses</span>
            <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${stats.expiredLicenses > 0 ? "text-rose-400" : "text-white"}`}>
              {stats.expiredLicenses}
            </span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">Immediate action required</span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden group shadow-xl">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expiring in 30 Days</span>
            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${stats.expiringSoonLicenses > 0 ? "text-amber-400" : "text-white"}`}>
              {stats.expiringSoonLicenses}
            </span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">Renewal warnings generated</span>
          </div>
        </div>

        {/* Critical Safety Scores */}
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl relative overflow-hidden group shadow-xl">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Critical Safety</span>
            <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${stats.criticalSafetyScores > 0 ? "text-rose-400" : "text-white"}`}>
              {stats.criticalSafetyScores}
            </span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">Safety scores under 70</span>
          </div>
        </div>
      </div>

      {/* Flagged Drivers List Card */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="text-indigo-400 w-5 h-5" />
          Drivers Flagged for Non-Compliance
        </h3>

        <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/20 text-xs font-semibold text-slate-400 uppercase">
                  <th className="px-6 py-4">Driver Details</th>
                  <th className="px-6 py-4">License / Class</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Safety Score</th>
                  <th className="px-6 py-4">Compliance Flags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {dataList.length > 0 ? (
                  dataList.map((driver) => {
                    const isSuspended = driver.status === DriverStatus.SUSPENDED;
                    const isOnTrip = driver.status === DriverStatus.ON_TRIP;
                    
                    return (
                      <tr
                        key={driver.id}
                        className={`hover:bg-slate-850/20 transition-colors ${
                          driver.flags.includes("LICENSE_EXPIRED") ? "bg-rose-500/[0.01]" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{driver.name}</span>
                            <span className="text-xs text-slate-500 mt-0.5">{driver.contactNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold text-slate-200">{driver.licenseNumber}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{driver.licenseCategory}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              driver.flags.includes("LICENSE_EXPIRED")
                                ? "text-rose-400 font-bold"
                                : driver.flags.includes("LICENSE_EXPIRING_SOON")
                                ? "text-amber-400 font-semibold"
                                : ""
                            }
                          >
                            {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          <span
                            className={
                              driver.safetyScore < 70 ? "text-rose-400" : "text-amber-400"
                            }
                          >
                            {driver.safetyScore} / 100
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {driver.flags.map((flag) => {
                              let pillStyle = "bg-slate-800 text-slate-400 border-slate-700";
                              if (flag === "LICENSE_EXPIRED") {
                                pillStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                              } else if (flag === "LICENSE_EXPIRING_SOON") {
                                pillStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                              } else if (flag === "CRITICAL_SAFETY_SCORE") {
                                pillStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                              } else if (flag === "DRIVER_SUSPENDED") {
                                pillStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                              }

                              return (
                                <span
                                  key={flag}
                                  className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider ${pillStyle}`}
                                >
                                  {flag.replace("_", " ")}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {/* Alert/Reminder Button */}
                            <button
                              onClick={() => handleSendReminder(driver.id)}
                              disabled={loadingDriverId === driver.id && actionType === "remind"}
                              title="Log compliance reminder"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-indigo-400 hover:text-indigo-300 disabled:opacity-40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-750"
                            >
                              {loadingDriverId === driver.id && actionType === "remind" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                              Remind
                            </button>

                            {/* Suspend Button */}
                            <button
                              onClick={() => handleSuspend(driver.id)}
                              disabled={isOnTrip || isSuspended || (loadingDriverId === driver.id && actionType === "suspend")}
                              title={isOnTrip ? "Cannot suspend driver on a trip" : isSuspended ? "Already suspended" : "Suspend driver"}
                              className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 disabled:opacity-30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-900/30"
                            >
                              {loadingDriverId === driver.id && actionType === "suspend" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                              {isSuspended ? "Suspended" : "Suspend"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      All systems green. No compliance flags detected!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
