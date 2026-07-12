import { prisma } from "../prisma";
import { VehicleStatus, Prisma } from "@prisma/client";
import { VehicleInput, vehicleSchema } from "../validations/vehicle";

export class VehicleServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleServiceError";
  }
}

export async function createVehicle(input: VehicleInput) {
  // Validate schema
  const data = vehicleSchema.parse(input);

  // Check if registration number already exists
  const existing = await prisma.vehicle.findUnique({
    where: { registrationNumber: data.registrationNumber },
  });

  if (existing) {
    throw new VehicleServiceError(
      `Registration number '${data.registrationNumber}' is already registered to vehicle '${existing.name}'.`
    );
  }

  return prisma.vehicle.create({
    data,
  });
}

export async function updateVehicle(id: string, input: Partial<VehicleInput>) {
  // Perform basic validations on whatever is passed in
  const data = vehicleSchema.partial().parse(input);

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new VehicleServiceError("Vehicle not found.");
  }

  // Check if unique registration number conflicts with other vehicles
  if (data.registrationNumber && data.registrationNumber !== vehicle.registrationNumber) {
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });
    if (existing && existing.id !== id) {
      throw new VehicleServiceError(
        `Registration number '${data.registrationNumber}' is already registered to another vehicle.`
      );
    }
  }

  // Business rule: If vehicle status is changing, enforce rules
  if (data.status && data.status !== vehicle.status) {
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw new VehicleServiceError(
        "Cannot change status while the vehicle is currently on a trip."
      );
    }
  }

  return prisma.vehicle.update({
    where: { id },
    data,
  });
}

export async function retireVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) {
    throw new VehicleServiceError("Vehicle not found.");
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new VehicleServiceError(
      "Cannot retire vehicle while it is currently on a trip. Complete or cancel the trip first."
    );
  }

  return prisma.vehicle.update({
    where: { id },
    data: { status: VehicleStatus.RETIRED },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          driver: true,
        },
      },
      maintenanceLogs: {
        orderBy: { startDate: "desc" },
        take: 10,
      },
      fuelLogs: {
        orderBy: { date: "desc" },
        take: 10,
      },
      expenses: {
        orderBy: { date: "desc" },
        take: 10,
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });
}

export interface VehicleFilterInput {
  status?: VehicleStatus;
  type?: string;
  region?: string;
  search?: string;
}

export async function listVehicles(filters: VehicleFilterInput = {}) {
  const where: Prisma.VehicleWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = {
      equals: filters.type,
      mode: "insensitive",
    };
  }

  if (filters.region) {
    where.region = {
      equals: filters.region,
      mode: "insensitive",
    };
  }

  if (filters.search) {
    where.OR = [
      {
        registrationNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        type: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function listAvailableVehiclesForDispatch() {
  return prisma.vehicle.findMany({
    where: { status: VehicleStatus.AVAILABLE },
    orderBy: { name: "asc" },
  });
}

/**
 * Gets unique vehicle types used in the fleet (for filter dropdowns)
 */
export async function getUniqueVehicleTypes() {
  const result = await prisma.vehicle.groupBy({
    by: ["type"],
    _count: {
      type: true,
    },
  });
  return result.map((r) => r.type);
}

/**
 * Gets unique vehicle regions used in the fleet (for filter dropdowns)
 */
export async function getUniqueVehicleRegions() {
  const result = await prisma.vehicle.groupBy({
    by: ["region"],
    where: {
      region: { not: null },
    },
  });
  return result.map((r) => r.region as string);
}
