import React from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getVehicleById } from "@/lib/domain/vehicle.service";
import { VehicleInspectView } from "@/components/vehicles/VehicleInspectView";

interface VehiclePageProps {
  params: {
    id: string;
  };
}

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const vehicle = await getVehicleById(params.id);

  if (!vehicle) {
    notFound();
  }

  // Map Decimal values to JavaScript numbers for serialization across Server/Client boundary
  const serializedVehicle = {
    ...vehicle,
    maxLoadCapacity: Number(vehicle.maxLoadCapacity),
    odometer: Number(vehicle.odometer),
    acquisitionCost: Number(vehicle.acquisitionCost),
    trips: vehicle.trips.map((t) => ({
      ...t,
      revenue: Number(t.revenue),
    })),
    maintenanceLogs: vehicle.maintenanceLogs.map((m) => ({
      ...m,
      cost: Number(m.cost),
    })),
    fuelLogs: vehicle.fuelLogs.map((f) => ({
      ...f,
      cost: Number(f.cost),
    })),
    expenses: vehicle.expenses.map((e) => ({
      ...e,
      amount: Number(e.amount),
    })),
  };

  return <VehicleInspectView vehicle={serializedVehicle} />;
}
