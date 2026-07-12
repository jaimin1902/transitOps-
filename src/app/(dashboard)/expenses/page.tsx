import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/rbac";
import {
  listFuelLogs,
  listExpenses,
  getFuelStats,
  getExpenseStats,
} from "@/lib/domain/expense.service";
import { prisma } from "@/lib/prisma";
import { ExpenseWorkspace } from "@/components/expenses/ExpenseWorkspace";
import { DollarSign } from "lucide-react";

export default async function ExpensesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  try {
    // RBAC Security Check
    assertPermission(session.user.role, "VIEW_FUEL_EXPENSES");
  } catch {
    redirect("/dashboard");
  }

  // Load lists, stats, and summaries concurrently
  const [fuelLogs, expenses, vehicles, trips, fuelStats, expenseStats] = await Promise.all([
    listFuelLogs(),
    listExpenses(),
    prisma.vehicle.findMany({
      select: { id: true, registrationNumber: true, name: true },
      orderBy: { registrationNumber: "asc" },
    }),
    prisma.trip.findMany({
      select: { id: true, source: true, destination: true },
      orderBy: { createdAt: "desc" },
    }),
    getFuelStats(),
    getExpenseStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-sm uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            Financial Audit
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Expenses tracking
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Monitor overall fleet expenditures, log fuel purchases, record toll tariffs, and calculate operations cost analytics.
          </p>
        </div>
      </div>

      {/* Interactive Tabs Workspace */}
      <ExpenseWorkspace
        initialFuelLogs={fuelLogs.map((f) => ({
          ...f,
          liters: Number(f.liters),
          cost: Number(f.cost),
          vehicle: {
            registrationNumber: f.vehicle.registrationNumber,
            name: f.vehicle.name,
          },
          trip: f.trip
            ? {
                source: f.trip.source,
                destination: f.trip.destination,
              }
            : null,
        }))}
        initialExpenses={expenses.map((e) => ({
          ...e,
          amount: Number(e.amount),
          vehicle: {
            registrationNumber: e.vehicle.registrationNumber,
            name: e.vehicle.name,
          },
        }))}
        vehicles={vehicles}
        trips={trips}
        fuelStats={{
          totalCost: Number(fuelStats.totalCost),
          totalLiters: Number(fuelStats.totalLiters),
          averageCostPerLiter: Number(fuelStats.averageCostPerLiter),
        }}
        expenseStats={{
          totalCost: Number(expenseStats.totalCost),
          breakdown: {
            TOLL: Number(expenseStats.breakdown.TOLL),
            MAINTENANCE: Number(expenseStats.breakdown.MAINTENANCE),
            OTHER: Number(expenseStats.breakdown.OTHER),
          },
        }}
      />
    </div>
  );
}
