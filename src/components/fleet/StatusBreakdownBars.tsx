"use client";

import React from "react";
import { VehicleStatus } from "@prisma/client";

interface VehicleMini {
  status: VehicleStatus;
}

interface StatusBreakdownBarsProps {
  vehicles: VehicleMini[];
}

export function StatusBreakdownBars({ vehicles }: StatusBreakdownBarsProps) {
  const total = vehicles.length;

  const counts = {
    AVAILABLE: vehicles.filter((v) => v.status === "AVAILABLE").length,
    ON_TRIP: vehicles.filter((v) => v.status === "ON_TRIP").length,
    IN_SHOP: vehicles.filter((v) => v.status === "IN_SHOP").length,
    RETIRED: vehicles.filter((v) => v.status === "RETIRED").length,
  };

  const getPercentage = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const statusConfig = [
    {
      key: "AVAILABLE",
      label: "Available",
      count: counts.AVAILABLE,
      percent: getPercentage(counts.AVAILABLE),
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    {
      key: "ON_TRIP",
      label: "On Trip",
      count: counts.ON_TRIP,
      percent: getPercentage(counts.ON_TRIP),
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      key: "IN_SHOP",
      label: "In Shop / Maintenance",
      count: counts.IN_SHOP,
      percent: getPercentage(counts.IN_SHOP),
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    {
      key: "RETIRED",
      label: "Retired",
      count: counts.RETIRED,
      percent: getPercentage(counts.RETIRED),
      color: "bg-gray-400",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statusConfig.map((item) => (
        <div
          key={item.key}
          className={`p-4 bg-white border border-gray-200 rounded-card shadow-small flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {item.label}
            </span>
            <span className={`text-sm font-extrabold ${item.textColor}`}>
              {item.count} <span className="text-[10px] text-gray-400 font-medium">({item.percent}%)</span>
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color} transition-all duration-500`}
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
