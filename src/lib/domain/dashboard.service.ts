import { prisma } from "../prisma";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";

export async function getDashboardStats() {
  const [
    vehicleCount,
    availableVehicleCount,
    driverCount,
    availableDriverCount,
    activeTripsCount,
    tripsSummary,
    fuelLogsSummary,
    maintenanceSummary,
    expensesSummary,
    recentTrips,
    recentAudits,
  ] = await Promise.all([
    // Vehicles count
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
    // Drivers count
    prisma.driver.count(),
    prisma.driver.count({ where: { status: DriverStatus.AVAILABLE } }),
    // Active trips
    prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
    // Total Revenue
    prisma.trip.aggregate({
      _sum: { revenue: true, plannedDistance: true, cargoWeight: true },
    }),
    // Fuel costs
    prisma.fuelLog.aggregate({
      _sum: { cost: true, liters: true },
    }),
    // Closed Maintenance costs
    prisma.maintenanceLog.aggregate({
      _sum: { cost: true },
    }),
    // Other Expenses
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    // Recent trips (latest 5)
    prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { registrationNumber: true } },
        driver: { select: { name: true } },
      },
    }),
    // Recent Audit Logs (latest 5)
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: "desc" },
    }),
  ]);

  // Calculations
  const totalRevenue = tripsSummary._sum.revenue || 0;
  const fuelSpent = fuelLogsSummary._sum.cost || 0;
  const maintenanceSpent = maintenanceSummary._sum.cost || 0;
  const otherSpent = expensesSummary._sum.amount || 0;

  const totalExpenses = fuelSpent + maintenanceSpent + otherSpent;
  const netProfit = totalRevenue - totalExpenses;
  const averageFuelCostPerLiter = (fuelLogsSummary._sum.liters || 0) > 0 
    ? fuelSpent / (fuelLogsSummary._sum.liters || 0) 
    : 0;

  // Let's generate a list of latest 6 completed/dispatched trips for chart data
  const chartTrips = await prisma.trip.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    where: {
      status: { in: [TripStatus.DISPATCHED, TripStatus.COMPLETED] },
    },
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      fuelLogs: { select: { cost: true } },
    },
  });

  const chartData = chartTrips.reverse().map((t) => {
    const fuelCost = t.fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
    // Estimated average maintenance + toll allocate to trip
    const estimatedExtra = t.plannedDistance * 0.1; // 10 cents per km
    const totalCost = fuelCost + estimatedExtra;

    return {
      label: `${t.source.split(" ")[0]} → ${t.destination.split(" ")[0]}`,
      revenue: Number(t.revenue),
      cost: Math.round(totalCost * 100) / 100,
    };
  });

  return {
    kpis: {
      totalRevenue: Number(totalRevenue),
      totalExpenses: Number(totalExpenses),
      netProfit: Number(netProfit),
      cargoWeight: Number(tripsSummary._sum.cargoWeight || 0),
      plannedDistance: Number(tripsSummary._sum.plannedDistance || 0),
      activeTrips: activeTripsCount,
      vehicleCount,
      availableVehicles: availableVehicleCount,
      driverCount,
      availableDrivers: availableDriverCount,
      averageFuelRate: averageFuelCostPerLiter,
    },
    recentTrips: recentTrips.map((t) => ({
      ...t,
      cargoWeight: Number(t.cargoWeight),
      plannedDistance: Number(t.plannedDistance),
      revenue: Number(t.revenue),
    })),
    recentAudits,
    chartData,
  };
}
