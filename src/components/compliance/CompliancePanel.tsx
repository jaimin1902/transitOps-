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
        alert("Driver has been suspended from operating dispatches.");
      } else {
        alert(res.error || "Failed to suspend driver.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during driver suspension.");
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
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Compliance Rate Card */}
        <div className="p-6 bg-white border border-gray-200 rounded-card relative overflow-hidden group shadow-small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Compliance Rate</span>
            <div className="w-8 h-8 bg-primary-50 border border-primary-100 text-primary-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{stats.complianceRate.toFixed(1)}%</span>
            <span className="text-xs text-gray-500 font-medium">compliant</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.complianceRate}%` }}
            ></div>
          </div>
        </div>

        {/* Expired Licenses */}
        <div className="p-6 bg-white border border-gray-200 rounded-card relative overflow-hidden group shadow-small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Expired Licenses</span>
            <div className="w-8 h-8 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${stats.expiredLicenses > 0 ? "text-rose-600" : "text-gray-900"}`}>
              {stats.expiredLicenses}
            </span>
            <span className="text-xs text-gray-400 block mt-1 font-medium">Immediate action required</span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="p-6 bg-white border border-gray-200 rounded-card relative overflow-hidden group shadow-small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Expiring in 30 Days</span>
            <div className="w-8 h-8 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${stats.expiringSoonLicenses > 0 ? "text-amber-600" : "text-gray-900"}`}>
              {stats.expiringSoonLicenses}
            </span>
            <span className="text-xs text-gray-400 block mt-1 font-medium">Renewal warnings generated</span>
          </div>
        </div>

        {/* Critical Safety Scores */}
        <div className="p-6 bg-white border border-gray-200 rounded-card relative overflow-hidden group shadow-small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Critical Safety</span>
            <div className="w-8 h-8 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${stats.criticalSafetyScores > 0 ? "text-rose-600" : "text-gray-900"}`}>
              {stats.criticalSafetyScores}
            </span>
            <span className="text-xs text-gray-400 block mt-1 font-medium">Safety scores under 70</span>
          </div>
        </div>
      </div>

      {/* Flagged Drivers List Card */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Compass className="text-primary-500 w-5 h-5" />
          Drivers Flagged for Non-Compliance
        </h3>

        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Driver Details</th>
                  <th className="px-6 py-4">License / Class</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Safety Score</th>
                  <th className="px-6 py-4">Compliance Flags</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {dataList.length > 0 ? (
                  dataList.map((driver) => {
                    const isSuspended = driver.status === DriverStatus.SUSPENDED;
                    const isOnTrip = driver.status === DriverStatus.ON_TRIP;

                    return (
                      <tr
                        key={driver.id}
                        className={`hover:bg-gray-50/30 transition-colors h-[52px] ${driver.flags.includes("LICENSE_EXPIRED") ? "bg-rose-50/10" : ""
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{driver.name}</span>
                            <span className="text-xs text-gray-400 mt-0.5">{driver.contactNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold text-gray-750">{driver.licenseNumber}</span>
                            <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-medium">{driver.licenseCategory}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              driver.flags.includes("LICENSE_EXPIRED")
                                ? "text-rose-600 font-bold"
                                : driver.flags.includes("LICENSE_EXPIRING_SOON")
                                  ? "text-amber-600 font-semibold"
                                  : "font-medium"
                            }
                          >
                            {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          <span
                            className={
                              driver.safetyScore < 70 ? "text-rose-600" : "text-amber-600"
                            }
                          >
                            {driver.safetyScore} / 100
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {driver.flags.map((flag) => {
                              let pillStyle = "bg-gray-100 text-gray-500 border-gray-250";
                              if (flag === "LICENSE_EXPIRED") {
                                pillStyle = "bg-rose-50 text-rose-700 border-rose-200";
                              } else if (flag === "LICENSE_EXPIRING_SOON") {
                                pillStyle = "bg-amber-50 text-amber-700 border-amber-200";
                              } else if (flag === "CRITICAL_SAFETY_SCORE") {
                                pillStyle = "bg-rose-50 text-rose-700 border-rose-200";
                              } else if (flag === "DRIVER_SUSPENDED") {
                                pillStyle = "bg-rose-50 text-rose-700 border-rose-200";
                              }

                              return (
                                <span
                                  key={flag}
                                  className={`inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full border uppercase tracking-wider ${pillStyle}`}
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
                              className="h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary-500 hover:border-primary-200 disabled:opacity-40 rounded-button text-xs font-bold transition-all flex items-center gap-1.5 shadow-small"
                            >
                              {loadingDriverId === driver.id && actionType === "remind" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                              )}
                              Remind
                            </button>

                            {/* Suspend Button */}
                            <button
                              onClick={() => handleSuspend(driver.id)}
                              disabled={isOnTrip || isSuspended || (loadingDriverId === driver.id && actionType === "suspend")}
                              title={isOnTrip ? "Cannot suspend driver on a trip" : isSuspended ? "Already suspended" : "Suspend driver"}
                              className="h-8 px-3 bg-red-50 border border-red-100 text-red-700 hover:bg-red-100 disabled:opacity-30 rounded-button text-xs font-bold transition-all flex items-center gap-1.5 shadow-small"
                            >
                              {loadingDriverId === driver.id && actionType === "suspend" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserX className="w-3.5 h-3.5 text-red-500" />
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
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
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
