import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";

export interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

export async function getTripsReport(filter: DateFilter = {}) {
  const where: Prisma.TripWhereInput = {};

  if (filter.startDate || filter.endDate) {
    where.createdAt = {};
    if (filter.startDate) {
      where.createdAt.gte = filter.startDate;
    }
    if (filter.endDate) {
      where.createdAt.lte = filter.endDate;
    }
  }

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { select: { registrationNumber: true, name: true } },
      driver: { select: { name: true } },
      fuelLogs: { select: { cost: true } },
    },
  });

  return trips.map((t) => {
    const fuelCost = t.fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
    const extraEstimatedCost = t.plannedDistance * 0.1; // 10 cents per km
    const totalExpenses = fuelCost + extraEstimatedCost;
    const netProfit = t.revenue - totalExpenses;

    return {
      id: t.id.substring(0, 8).toUpperCase(),
      source: t.source,
      destination: t.destination,
      vehiclePlate: t.vehicle.registrationNumber,
      vehicleName: t.vehicle.name,
      driverName: t.driver.name,
      cargoWeight: Number(t.cargoWeight),
      plannedDistance: Number(t.plannedDistance),
      actualDistance: t.actualDistance ? Number(t.actualDistance) : 0,
      revenue: Number(t.revenue),
      estimatedExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      status: t.status,
      createdAt: t.createdAt,
      dispatchedAt: t.dispatchedAt,
      completedAt: t.completedAt,
    };
  });
}

export async function getMaintenanceReport(filter: DateFilter = {}) {
  const where: Prisma.MaintenanceLogWhereInput = {};

  if (filter.startDate || filter.endDate) {
    where.startDate = {};
    if (filter.startDate) {
      where.startDate.gte = filter.startDate;
    }
    if (filter.endDate) {
      where.startDate.lte = filter.endDate;
    }
  }

  const logs = await prisma.maintenanceLog.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      vehicle: { select: { registrationNumber: true, name: true } },
    },
  });

  return logs.map((l) => ({
    id: l.id.substring(0, 8).toUpperCase(),
    vehiclePlate: l.vehicle.registrationNumber,
    vehicleName: l.vehicle.name,
    type: l.type,
    description: l.description || "",
    cost: Number(l.cost),
    status: l.status,
    startDate: l.startDate,
    endDate: l.endDate,
  }));
}

export async function getExpensesReport(filter: DateFilter = {}) {
  const where: Prisma.ExpenseWhereInput = {};

  if (filter.startDate || filter.endDate) {
    where.date = {};
    if (filter.startDate) {
      where.date.gte = filter.startDate;
    }
    if (filter.endDate) {
      where.date.lte = filter.endDate;
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { registrationNumber: true, name: true } },
    },
  });

  return expenses.map((e) => ({
    id: e.id.substring(0, 8).toUpperCase(),
    vehiclePlate: e.vehicle.registrationNumber,
    vehicleName: e.vehicle.name,
    type: e.type,
    amount: Number(e.amount),
    description: e.description || "",
    date: e.date,
  }));
}

export async function getFuelReport(filter: DateFilter = {}) {
  const where: Prisma.FuelLogWhereInput = {};

  if (filter.startDate || filter.endDate) {
    where.date = {};
    if (filter.startDate) {
      where.date.gte = filter.startDate;
    }
    if (filter.endDate) {
      where.date.lte = filter.endDate;
    }
  }

  const fuelLogs = await prisma.fuelLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      vehicle: { select: { registrationNumber: true, name: true } },
      trip: { select: { source: true, destination: true } },
    },
  });

  return fuelLogs.map((f) => ({
    id: f.id.substring(0, 8).toUpperCase(),
    vehiclePlate: f.vehicle.registrationNumber,
    vehicleName: f.vehicle.name,
    liters: Number(f.liters),
    cost: Number(f.cost),
    tripRoute: f.trip ? `${f.trip.source} → ${f.trip.destination}` : "none",
    date: f.date,
  }));
}
