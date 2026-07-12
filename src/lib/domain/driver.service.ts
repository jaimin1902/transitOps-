import { prisma } from "../prisma";
import { DriverStatus, Prisma } from "@prisma/client";
import { DriverInput, driverSchema } from "../validations/driver";

export class DriverServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriverServiceError";
  }
}

export async function createDriver(input: DriverInput) {
  const data = driverSchema.parse(input);

  // Check unique license number
  const existing = await prisma.driver.findUnique({
    where: { licenseNumber: data.licenseNumber },
  });

  if (existing) {
    throw new DriverServiceError(
      `License number '${data.licenseNumber}' is already registered to driver '${existing.name}'.`
    );
  }

  // If userId is provided, ensure it's not already linked to another driver
  if (data.userId) {
    const userLinked = await prisma.driver.findUnique({
      where: { userId: data.userId },
    });
    if (userLinked) {
      throw new DriverServiceError("This user account is already linked to another driver registry.");
    }
  }

  return prisma.driver.create({
    data: {
      name: data.name,
      licenseNumber: data.licenseNumber,
      licenseCategory: data.licenseCategory,
      licenseExpiryDate: data.licenseExpiryDate,
      contactNumber: data.contactNumber,
      safetyScore: data.safetyScore,
      status: data.status,
      userId: data.userId || null,
    },
  });
}

export async function updateDriver(id: string, input: Partial<DriverInput>) {
  const data = driverSchema.partial().parse(input);

  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    throw new DriverServiceError("Driver not found.");
  }

  // Check unique license number conflicts
  if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (existing && existing.id !== id) {
      throw new DriverServiceError(
        `License number '${data.licenseNumber}' is already registered to another driver.`
      );
    }
  }

  // Enforce business rules on status change
  if (data.status && data.status !== driver.status) {
    if (driver.status === DriverStatus.ON_TRIP) {
      throw new DriverServiceError("Cannot change status of a driver who is currently on a trip.");
    }
  }

  return prisma.driver.update({
    where: { id },
    data,
  });
}

export async function suspendDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) {
    throw new DriverServiceError("Driver not found.");
  }

  if (driver.status === DriverStatus.ON_TRIP) {
    throw new DriverServiceError(
      "Cannot suspend driver while they are currently on a trip. Complete the trip first."
    );
  }

  return prisma.driver.update({
    where: { id },
    data: { status: DriverStatus.SUSPENDED },
  });
}

export async function getDriverById(id: string) {
  return prisma.driver.findUnique({
    where: { id },
    include: {
      user: true,
      trips: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          vehicle: true,
        },
      },
    },
  });
}

export interface DriverFilterInput {
  status?: DriverStatus;
  search?: string;
}

export async function listDrivers(filters: DriverFilterInput = {}) {
  const where: Prisma.DriverWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        licenseNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        contactNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return prisma.driver.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function listAvailableDriversForDispatch() {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiryDate: {
        gt: new Date(), // license must not be expired
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Compliance Dashboard aggregates and flags
 */
export async function getComplianceDashboard() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch all drivers to calculate compliance details
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
    },
  });

  const totalDrivers = drivers.length;

  let expiredLicenses = 0;
  let expiringSoonLicenses = 0; // next 30 days
  let criticalSafetyScores = 0; // safetyScore < 70
  let suspendedCount = 0;

  const flaggedDrivers = drivers.map((d) => {
    const isExpired = d.licenseExpiryDate < now;
    const isExpiringSoon = !isExpired && d.licenseExpiryDate <= thirtyDaysFromNow;
    const hasCriticalSafety = d.safetyScore < 70;
    const isSuspended = d.status === DriverStatus.SUSPENDED;

    const flags: string[] = [];
    if (isExpired) flags.push("LICENSE_EXPIRED");
    if (isExpiringSoon) flags.push("LICENSE_EXPIRING_SOON");
    if (hasCriticalSafety) flags.push("CRITICAL_SAFETY_SCORE");
    if (isSuspended) flags.push("DRIVER_SUSPENDED");

    if (isExpired) expiredLicenses++;
    if (isExpiringSoon) expiringSoonLicenses++;
    if (hasCriticalSafety) criticalSafetyScores++;
    if (isSuspended) suspendedCount++;

    return {
      ...d,
      flags,
      isCompliant: flags.length === 0 || (flags.length === 1 && flags[0] === "LICENSE_EXPIRING_SOON"), // expiring soon is a warning, not non-compliant yet
    };
  });

  const nonCompliantDrivers = flaggedDrivers.filter((fd) => !fd.isCompliant || fd.flags.length > 0);
  const compliantCount = totalDrivers - flaggedDrivers.filter(d => d.flags.includes("LICENSE_EXPIRED") || d.flags.includes("DRIVER_SUSPENDED")).length;
  const complianceRate = totalDrivers > 0 ? (compliantCount / totalDrivers) * 100 : 100;

  return {
    stats: {
      totalDrivers,
      compliantDrivers: compliantCount,
      complianceRate,
      expiredLicenses,
      expiringSoonLicenses,
      criticalSafetyScores,
      suspendedDrivers: suspendedCount,
    },
    flaggedDrivers: nonCompliantDrivers,
  };
}

/**
 * Creates a compliance reminder notification log
 */
export async function sendComplianceReminder(driverId: string) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    throw new DriverServiceError("Driver not found.");
  }

  // Create log in database
  return prisma.notificationLog.create({
    data: {
      type: "DRIVER_LICENSE_EXPIRY",
      referenceId: driverId,
    },
  });
}
