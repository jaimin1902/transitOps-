import { prisma } from "../prisma";
import { TripStatus, VehicleStatus, DriverStatus, Prisma } from "@prisma/client";
import { CreateTripInput, DispatchTripInput, CompleteTripInput } from "../validations/trip";

export class TripServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripServiceError";
  }
}

export async function createTrip(userId: string, input: CreateTripInput) {
  return prisma.trip.create({
    data: {
      source: input.source,
      destination: input.destination,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      cargoWeight: input.cargoWeight,
      plannedDistance: input.plannedDistance,
      revenue: input.revenue,
      status: TripStatus.DRAFT,
      createdById: userId,
    },
  });
}

export async function dispatchTrip(tripId: string, userId: string, input: DispatchTripInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch Trip details
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      throw new TripServiceError("Trip record not found.");
    }

    if (trip.status !== TripStatus.DRAFT) {
      throw new TripServiceError(`Cannot dispatch a trip that is in '${trip.status}' status.`);
    }

    // 2. Lock & Verify Vehicle Status
    const vehicle = await tx.vehicle.findUnique({
      where: { id: trip.vehicleId },
    });

    if (!vehicle) {
      throw new TripServiceError("Assigned vehicle not found.");
    }

    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new TripServiceError(
        `Vehicle '${vehicle.registrationNumber}' is not available (Current status: ${vehicle.status}).`
      );
    }

    // 3. Lock & Verify Driver Status
    const driver = await tx.driver.findUnique({
      where: { id: trip.driverId },
    });

    if (!driver) {
      throw new TripServiceError("Assigned driver not found.");
    }

    if (driver.status !== DriverStatus.AVAILABLE) {
      throw new TripServiceError(
        `Driver '${driver.name}' is not available (Current status: ${driver.status}).`
      );
    }

    // Check license expiration
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      throw new TripServiceError(
        `Driver '${driver.name}' has an expired license and cannot be dispatched.`
      );
    }

    // 4. Verify Odometer
    if (input.startOdometer < vehicle.odometer) {
      throw new TripServiceError(
        `Start odometer (${input.startOdometer} km) cannot be less than the vehicle's current odometer (${vehicle.odometer} km).`
      );
    }

    // 5. Update vehicle status
    await tx.vehicle.update({
      where: { id: vehicle.id },
      data: { status: VehicleStatus.ON_TRIP },
    });

    // 6. Update driver status
    await tx.driver.update({
      where: { id: driver.id },
      data: { status: DriverStatus.ON_TRIP },
    });

    // 7. Update Trip details
    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.DISPATCHED,
        startOdometer: input.startOdometer,
        dispatchedAt: new Date(),
      },
    });

    // 8. Log Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        action: "DISPATCH_TRIP",
        entityType: "TRIP",
        entityId: tripId,
      },
    });

    return updatedTrip;
  });
}

export async function completeTrip(tripId: string, userId: string, input: CompleteTripInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch Trip details
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      throw new TripServiceError("Trip record not found.");
    }

    if (trip.status !== TripStatus.DISPATCHED) {
      throw new TripServiceError(`Cannot complete a trip that is in '${trip.status}' status.`);
    }

    const startOdom = trip.startOdometer || 0;

    // 2. Validate ending odometer
    if (input.endOdometer <= startOdom) {
      throw new TripServiceError(
        `Ending odometer (${input.endOdometer} km) must exceed start odometer (${startOdom} km).`
      );
    }

    // 3. Update Vehicle status and odometer reading
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: VehicleStatus.AVAILABLE,
        odometer: input.endOdometer,
      },
    });

    // 4. Update Driver status
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE },
    });

    // 5. Update Trip details
    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.COMPLETED,
        endOdometer: input.endOdometer,
        actualDistance: input.actualDistance,
        fuelConsumed: input.fuelConsumed,
        completedAt: new Date(),
      },
    });

    // 6. Log Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        action: "COMPLETE_TRIP",
        entityType: "TRIP",
        entityId: tripId,
      },
    });

    return updatedTrip;
  });
}

export async function cancelTrip(tripId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new TripServiceError("Trip record not found.");
    }

    if (trip.status !== TripStatus.DRAFT) {
      throw new TripServiceError(`Cannot cancel a trip that is in '${trip.status}' status.`);
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "CANCEL_TRIP",
        entityType: "TRIP",
        entityId: tripId,
      },
    });

    return updatedTrip;
  });
}

/**
 * Get a single trip with full details — used by /trips/[id]
 */
export async function getTripById(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          name: true,
          type: true,
          odometer: true,
          maxLoadCapacity: true,
          status: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          licenseNumber: true,
          licenseCategory: true,
          safetyScore: true,
          status: true,
        },
      },
      fuelLogs: { orderBy: { date: "desc" } },
      createdBy: { select: { name: true, role: true } },
    },
  });
}

export interface TripFilterInput {
  status?: TripStatus;
  search?: string;
}

export async function listTrips(filters: TripFilterInput = {}) {
  const where: Prisma.TripWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      {
        source: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        destination: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        vehicle: {
          registrationNumber: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
      {
        driver: {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  return prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: true,
      driver: true,
    },
  });
}

