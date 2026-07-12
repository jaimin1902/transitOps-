import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  listVehicles,
  getUniqueVehicleTypes,
  getUniqueVehicleRegions,
} from "@/lib/domain/vehicle.service";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { Truck } from "lucide-react";

export default async function VehiclesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch initial dataset from database
  const [vehicles, uniqueTypes, uniqueRegions] = await Promise.all([
    listVehicles(),
    getUniqueVehicleTypes(),
    getUniqueVehicleRegions(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            Operations Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Vehicle Registry
          </h1>
          <p className="text-gray-500 text-sm">
            Monitor, inspect, and update registrations, loads, regions, and statuses for your active fleet.
          </p>
        </div>
      </div>

      {/* Main Interactive Table */}
      <VehicleTable
        initialVehicles={vehicles.map(v => ({
          ...v,
          maxLoadCapacity: Number(v.maxLoadCapacity),
          odometer: Number(v.odometer),
          acquisitionCost: Number(v.acquisitionCost),
        }))}
        uniqueTypes={uniqueTypes}
        uniqueRegions={uniqueRegions}
      />
    </div>
  );
}
