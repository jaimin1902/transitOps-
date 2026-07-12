import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listTrips } from "@/lib/domain/trip.service";
import { listAvailableVehiclesForDispatch } from "@/lib/domain/vehicle.service";
import { listAvailableDriversForDispatch } from "@/lib/domain/driver.service";
import { TripTable } from "@/components/trips/TripTable";
import { Route } from "lucide-react";

export default async function TripsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Load dispatches registry, available vehicles and drivers
  const [trips, availableVehicles, availableDrivers] = await Promise.all([
    listTrips(),
    listAvailableVehiclesForDispatch(),
    listAvailableDriversForDispatch(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider">
            <Route className="w-4 h-4" />
            Operations Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Dispatch Registry
          </h1>
          <p className="text-gray-500 text-sm">
            Register new logistics dispatches, allocate fleet vehicles, assign operators, and track running trip states.
          </p>
        </div>
      </div>

      {/* Main Interactive Table */}
      <TripTable
        initialTrips={trips.map(t => ({
          ...t,
          cargoWeight: Number(t.cargoWeight),
          plannedDistance: Number(t.plannedDistance),
          actualDistance: t.actualDistance ? Number(t.actualDistance) : null,
          startOdometer: t.startOdometer ? Number(t.startOdometer) : null,
          endOdometer: t.endOdometer ? Number(t.endOdometer) : null,
          fuelConsumed: t.fuelConsumed ? Number(t.fuelConsumed) : null,
          revenue: Number(t.revenue),
          vehicle: {
            ...t.vehicle,
            odometer: Number(t.vehicle.odometer),
          },
          driver: {
            ...t.driver,
            safetyScore: Number(t.driver.safetyScore),
          },
        }))}
        availableVehicles={availableVehicles.map(v => ({
          id: v.id,
          name: v.name,
          registrationNumber: v.registrationNumber,
          odometer: Number(v.odometer),
        }))}
        availableDrivers={availableDrivers.map(d => ({
          id: d.id,
          name: d.name,
          licenseCategory: d.licenseCategory,
          safetyScore: Number(d.safetyScore),
        }))}
      />
    </div>
  );
}
