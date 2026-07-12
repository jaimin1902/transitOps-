"use client";

import React from "react";
import { TripStatus } from "@prisma/client";
import { StatusBadge } from "../trips/StatusBadge";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

interface RecentTrip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  revenue: number;
  status: TripStatus;
  vehicle: {
    registrationNumber: string;
  };
  driver: {
    name: string;
  };
}

interface RecentDispatchesProps {
  trips: RecentTrip[];
}

export function RecentDispatches({ trips }: RecentDispatchesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Recent dispatches</h3>
          <p className="text-xs text-gray-500 mt-0.5">Overview of the latest registered logistics trips</p>
        </div>
        <Link
          href="/trips"
          className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 hover:underline transition-all"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {trips.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium py-10">
            No trips registered in the fleet database.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-150 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Operator</th>
                <th className="px-4 py-2">Revenue</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-400">
                    {trip.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {trip.source} &rarr; {trip.destination}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block font-medium uppercase tracking-wider">
                      Plate: {trip.vehicle.registrationNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{trip.driver.name}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">${trip.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={trip.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
