import { prisma } from "../prisma";
import { MaintenanceStatus, VehicleStatus, Prisma } from "@prisma/client";
import { CreateMaintenanceInput, ResolveMaintenanceInput } from "../validations/maintenance";

export class MaintenanceServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaintenanceServiceError";
  }
}

export async function createMaintenanceLog(input: CreateMaintenanceInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify vehicle status
    const vehicle = await tx.vehicle.findUnique({
      where: { id: input.vehicleId },
    });

    if (!vehicle) {
      throw new MaintenanceServiceError("Vehicle asset not found.");
    }

    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new MaintenanceServiceError(
        "Cannot schedule maintenance while the vehicle is currently on a trip."
      );
    }

    // 2. Put vehicle in shop status
    await tx.vehicle.update({
      where: { id: vehicle.id },
      data: { status: VehicleStatus.IN_SHOP },
    });

    // 3. Create the log entry
    return tx.maintenanceLog.create({
      data: {
        vehicleId: input.vehicleId,
        type: input.type,
        description: input.description || null,
        cost: input.cost,
        status: MaintenanceStatus.ACTIVE,
        startDate: input.startDate,
      },
    });
  });
}

export async function resolveMaintenanceLog(
  logId: string,
  userId: string,
  input: ResolveMaintenanceInput
) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch open log details
    const log = await tx.maintenanceLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      throw new MaintenanceServiceError("Maintenance log not found.");
    }

    if (log.status !== MaintenanceStatus.ACTIVE) {
      throw new MaintenanceServiceError("Cannot resolve a maintenance service that is already closed.");
    }

    // 2. Update log to closed
    const updatedLog = await tx.maintenanceLog.update({
      where: { id: logId },
      data: {
        status: MaintenanceStatus.COMPLETED,
        cost: input.cost,
        endDate: input.endDate,
      },
    });

    // 3. Check if there are other open maintenance logs for this vehicle
    const openLogsCount = await tx.maintenanceLog.count({
      where: {
        vehicleId: log.vehicleId,
        status: MaintenanceStatus.ACTIVE,
      },
    });

    if (openLogsCount === 0) {
      const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      // If the vehicle is currently "IN_SHOP", restore it to "AVAILABLE"
      if (vehicle && vehicle.status === VehicleStatus.IN_SHOP) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }
    }

    // 4. Create Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        action: "RESOLVE_MAINTENANCE",
        entityType: "VEHICLE",
        entityId: log.vehicleId,
      },
    });

    return updatedLog;
  });
}

export interface MaintenanceFilterInput {
  status?: MaintenanceStatus;
  vehicleId?: string;
}

export async function listMaintenanceLogs(filters: MaintenanceFilterInput = {}) {
  const where: Prisma.MaintenanceLogWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  return prisma.maintenanceLog.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      vehicle: true,
    },
  });
}

export async function listVehiclesForMaintenance() {
  return prisma.vehicle.findMany({
    where: {
      status: {
        in: [VehicleStatus.AVAILABLE, VehicleStatus.IN_SHOP],
      },
    },
    orderBy: { registrationNumber: "asc" },
  });
}
