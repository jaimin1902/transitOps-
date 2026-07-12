"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: "vehicle" | "driver" | "trip" | "maintenance";
  link: string;
}

export async function searchGlobalAction(query: string) {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return { success: true, results: [] };
  }

  try {
    const [vehicles, drivers, trips, maintenance] = await Promise.all([
      // 1. Search Vehicles
      prisma.vehicle.findMany({
        where: {
          OR: [
            { registrationNumber: { contains: trimmedQuery, mode: "insensitive" } },
            { name: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
        select: { id: true, registrationNumber: true, name: true },
        take: 4,
      }),
      // 2. Search Drivers
      prisma.driver.findMany({
        where: {
          OR: [
            { name: { contains: trimmedQuery, mode: "insensitive" } },
            { licenseNumber: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, licenseNumber: true },
        take: 4,
      }),
      // 3. Search Trips
      prisma.trip.findMany({
        where: {
          OR: [
            { source: { contains: trimmedQuery, mode: "insensitive" } },
            { destination: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
        select: { id: true, source: true, destination: true },
        take: 4,
      }),
      // 4. Search Maintenance logs
      prisma.maintenanceLog.findMany({
        where: {
          OR: [
            { type: { contains: trimmedQuery, mode: "insensitive" } },
            { description: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        },
        select: { id: true, type: true, vehicle: { select: { registrationNumber: true } } },
        take: 4,
      }),
    ]);

    const results: SearchResultItem[] = [];

    // Map Vehicles
    vehicles.forEach((v) => {
      results.push({
        id: v.id,
        title: v.registrationNumber,
        subtitle: `Vehicle: ${v.name}`,
        type: "vehicle",
        link: `/vehicles/${v.id}`,
      });
    });

    // Map Drivers
    drivers.forEach((d) => {
      results.push({
        id: d.id,
        title: d.name,
        subtitle: `Driver License: ${d.licenseNumber}`,
        type: "driver",
        link: `/drivers`,
      });
    });

    // Map Trips
    trips.forEach((t) => {
      results.push({
        id: t.id,
        title: `${t.source} → ${t.destination}`,
        subtitle: `Dispatch Trip ID: ${t.id.substring(0, 8).toUpperCase()}`,
        type: "trip",
        link: `/trips`,
      });
    });

    // Map Maintenance
    maintenance.forEach((m) => {
      results.push({
        id: m.id,
        title: `Service: ${m.type}`,
        subtitle: `Plate: ${m.vehicle.registrationNumber}`,
        type: "maintenance",
        link: `/maintenance`,
      });
    });

    return { success: true, results };
  } catch (error: unknown) {
    console.error("Global search error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute global search.";
    return { success: false, error: message };
  }
}
