import { prisma } from "../prisma";
import { ExpenseType, Prisma } from "@prisma/client";
import { CreateFuelLogInput, CreateExpenseInput } from "../validations/expense";

export async function createFuelLog(input: CreateFuelLogInput) {
  return prisma.fuelLog.create({
    data: {
      vehicleId: input.vehicleId,
      tripId: input.tripId || null,
      liters: input.liters,
      cost: input.cost,
      date: input.date,
    },
  });
}

export async function createExpense(input: CreateExpenseInput) {
  return prisma.expense.create({
    data: {
      vehicleId: input.vehicleId,
      type: input.type,
      amount: input.amount,
      date: input.date,
      description: input.description || null,
    },
  });
}

export interface FuelFilterInput {
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function listFuelLogs(filters: FuelFilterInput = {}) {
  const where: Prisma.FuelLogWhereInput = {};

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  return prisma.fuelLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      vehicle: true,
      trip: true,
    },
  });
}

export interface ExpenseFilterInput {
  vehicleId?: string;
  type?: ExpenseType;
  startDate?: Date;
  endDate?: Date;
}

export async function listExpenses(filters: ExpenseFilterInput = {}) {
  const where: Prisma.ExpenseWhereInput = {};

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.date.lte = filters.endDate;
    }
  }

  return prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      vehicle: true,
    },
  });
}

export async function getFuelStats() {
  const aggregate = await prisma.fuelLog.aggregate({
    _sum: {
      liters: true,
      cost: true,
    },
    _count: {
      id: true,
    },
  });

  const totalCost = aggregate._sum.cost || 0;
  const totalLiters = aggregate._sum.liters || 0;
  const averageCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

  return {
    totalCost,
    totalLiters,
    averageCostPerLiter,
    count: aggregate._count.id,
  };
}

export async function getExpenseStats() {
  const aggregate = await prisma.expense.aggregate({
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  const tollSum = await prisma.expense.aggregate({
    where: { type: ExpenseType.TOLL },
    _sum: { amount: true },
  });

  const maintenanceSum = await prisma.expense.aggregate({
    where: { type: ExpenseType.MAINTENANCE },
    _sum: { amount: true },
  });

  const otherSum = await prisma.expense.aggregate({
    where: { type: ExpenseType.OTHER },
    _sum: { amount: true },
  });

  return {
    totalCost: aggregate._sum.amount || 0,
    count: aggregate._count.id,
    breakdown: {
      TOLL: tollSum._sum.amount || 0,
      MAINTENANCE: maintenanceSum._sum.amount || 0,
      OTHER: otherSum._sum.amount || 0,
    },
  };
}

export async function listTripsForFuelSelection(vehicleId?: string) {
  const where: Prisma.TripWhereInput = {};
  if (vehicleId) {
    where.vehicleId = vehicleId;
  }
  return prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      source: true,
      destination: true,
      createdAt: true,
    },
  });
}
