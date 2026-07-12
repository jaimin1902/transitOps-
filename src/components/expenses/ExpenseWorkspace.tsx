"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { ExpenseType } from "@prisma/client";
import { FuelLogDialogForm } from "./FuelLogDialogForm";
import { ExpenseDialogForm } from "./ExpenseDialogForm";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  FilterX,
  Droplet,
  DollarSign,
  TrendingUp,
  Receipt,
  Eye,
} from "lucide-react";

interface FuelLog {
  id: string;
  vehicleId: string;
  tripId: string | null;
  liters: number;
  cost: number;
  date: Date;
  vehicle: {
    registrationNumber: string;
    name: string;
  };
  trip: {
    source: string;
    destination: string;
  } | null;
}

interface Expense {
  id: string;
  vehicleId: string;
  type: ExpenseType;
  amount: number;
  date: Date;
  description: string | null;
  vehicle: {
    registrationNumber: string;
    name: string;
  };
}

interface VehicleSummary {
  id: string;
  registrationNumber: string;
  name: string;
}

interface TripSummary {
  id: string;
  source: string;
  destination: string;
}

interface ExpenseWorkspaceProps {
  initialFuelLogs: FuelLog[];
  initialExpenses: Expense[];
  vehicles: VehicleSummary[];
  trips: TripSummary[];
  fuelStats: {
    totalCost: number;
    totalLiters: number;
    averageCostPerLiter: number;
  };
  expenseStats: {
    totalCost: number;
    breakdown: Record<ExpenseType, number>;
  };
}

export function ExpenseWorkspace({
  initialFuelLogs,
  initialExpenses,
  vehicles,
  trips,
  fuelStats,
  expenseStats,
}: ExpenseWorkspaceProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = hasPermission(userRole, "MANAGE_FUEL_EXPENSES");

  const [activeTab, setActiveTab] = useState<"expenses" | "fuel">("expenses");

  // Filters State
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Modals state
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedType("");
  };

  // Local filtered states
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((e) => {
      const matchesSearch =
        globalFilter === "" ||
        e.vehicle.registrationNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
        e.vehicle.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(globalFilter.toLowerCase()));

      const matchesType = selectedType === "" || e.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [initialExpenses, globalFilter, selectedType]);

  const filteredFuelLogs = useMemo(() => {
    return initialFuelLogs.filter((f) => {
      const matchesSearch =
        globalFilter === "" ||
        f.vehicle.registrationNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
        f.vehicle.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (f.trip && f.trip.source.toLowerCase().includes(globalFilter.toLowerCase())) ||
        (f.trip && f.trip.destination.toLowerCase().includes(globalFilter.toLowerCase()));

      return matchesSearch;
    });
  }, [initialFuelLogs, globalFilter]);

  // TanStack Expense Columns
  const expenseColumns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        id: "vehicle",
        header: "Vehicle Plate",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-gray-900">
              {row.original.vehicle.registrationNumber}
            </span>
            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{row.original.vehicle.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Category",
        cell: (info) => (
          <span className="font-semibold text-gray-700 uppercase text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <span className="text-gray-500 text-xs block truncate max-w-[200px]" title={info.getValue() as string || ""}>
            {info.getValue() as string || "—"}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Record Date",
        cell: (info) => (
          <span className="text-gray-500 text-xs">
            {new Date(info.getValue() as Date).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => (
          <span className="font-bold text-red-600">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Link
              href={`/vehicles/${row.original.vehicleId}`}
              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
              title="Inspect vehicle logs"
            >
              <Eye className="w-4.5 h-4.5" />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  // TanStack Fuel Columns
  const fuelColumns = useMemo<ColumnDef<FuelLog>[]>(
    () => [
      {
        id: "vehicle",
        header: "Vehicle Plate",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-gray-900">
              {row.original.vehicle.registrationNumber}
            </span>
            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{row.original.vehicle.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "liters",
        header: "Liters",
        cell: (info) => <span className="font-semibold text-gray-700">{(info.getValue() as number).toLocaleString()} L</span>,
      },
      {
        id: "trip",
        header: "Associated Trip",
        cell: ({ row }) => {
          const trip = row.original.trip;
          if (!trip) return <span className="text-gray-400 text-xs italic">none</span>;
          return (
            <span className="text-gray-600 text-xs">
              {trip.source} &rarr; {trip.destination}
            </span>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Purchase Date",
        cell: (info) => (
          <span className="text-gray-500 text-xs">
            {new Date(info.getValue() as Date).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Total Cost",
        cell: (info) => (
          <span className="font-bold text-red-600">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Link
              href={`/vehicles/${row.original.vehicleId}`}
              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
              title="Inspect vehicle logs"
            >
              <Eye className="w-4.5 h-4.5" />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const expenseTable = useReactTable({
    data: filteredExpenses,
    columns: expenseColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const fuelTable = useReactTable({
    data: filteredFuelLogs,
    columns: fuelColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const overallCost = fuelStats.totalCost + expenseStats.totalCost;

  return (
    <div className="space-y-6">
      {/* Top Section Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Fuel Expense */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-primary-500 shrink-0">
            <Droplet className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Fuel Spent</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${fuelStats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{fuelStats.totalLiters.toLocaleString()} liters bought</p>
          </div>
        </div>

        {/* Card 2: Fuel Efficiency Unit */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fuel unit cost</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${fuelStats.averageCostPerLiter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Average dollar rate per liter</p>
          </div>
        </div>

        {/* Card 3: Other Expenses */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Other Expenses</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${expenseStats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Tolls, repairs, licensing etc.</p>
          </div>
        </div>

        {/* Card 4: Total Operation Cost */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Fleet Cost</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              ${overallCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total operations spend</p>
          </div>
        </div>
      </div>

      {/* Main Tab Workspace */}
      <div className="bg-white border border-gray-200 rounded-card shadow-small overflow-hidden">
        {/* Tab Selection */}
        <div className="flex border-b border-gray-250 bg-gray-50/50 justify-between items-center px-6">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab("expenses");
                resetFilters();
              }}
              className={`py-4 px-6 text-sm font-semibold border-b-2 transition-all duration-150 ${
                activeTab === "expenses"
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              General Expenses
            </button>
            <button
              onClick={() => {
                setActiveTab("fuel");
                resetFilters();
              }}
              className={`py-4 px-6 text-sm font-semibold border-b-2 transition-all duration-150 ${
                activeTab === "fuel"
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Fuel Purchase Logs
            </button>
          </div>

          {/* Quick Actions (Manage Only) */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFuelOpen(true)}
                className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-button transition-colors flex items-center gap-1.5 shadow-small"
              >
                <Plus className="w-4 h-4" />
                Log fuel
              </button>
              <button
                onClick={() => setIsExpenseOpen(true)}
                className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-button transition-colors flex items-center gap-1.5 shadow-small"
              >
                <Plus className="w-4 h-4" />
                Record expense
              </button>
            </div>
          )}
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            {/* Search Query */}
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === "expenses"
                    ? "Search plate, vehicle name, note..."
                    : "Search plate, vehicle name, trip source..."
                }
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-3">
              {/* Category filter only on expenses */}
              {activeTab === "expenses" && (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-[42px] px-3 bg-white border border-gray-300 text-gray-700 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none pr-8 relative select-arrow"
                >
                  <option value="">All Categories</option>
                  <option value={ExpenseType.TOLL}>Toll</option>
                  <option value={ExpenseType.MAINTENANCE}>Maintenance Fee</option>
                  <option value={ExpenseType.OTHER}>Other</option>
                </select>
              )}

              {/* Clear Filters */}
              {(globalFilter || selectedType) && (
                <button
                  onClick={resetFilters}
                  title="Reset filters"
                  className="h-10 px-3 bg-white hover:bg-gray-50 border border-gray-350 text-gray-500 hover:text-gray-800 rounded-input transition-colors flex items-center justify-center"
                >
                  <FilterX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table display */}
          {activeTab === "expenses" ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-small">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {expenseTable.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                        {hg.headers.map((h) => (
                          <th key={h.id} className="px-6 py-4 select-none">
                            {h.isPlaceholder
                              ? null
                              : flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {expenseTable.getRowModel().rows.length > 0 ? (
                      expenseTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors h-[52px]">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-6 py-3 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={expenseColumns.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                          No expense logs registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {expenseTable.getPageCount() > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/20 text-xs">
                  <span className="text-gray-500 font-medium">
                    Showing page {expenseTable.getState().pagination.pageIndex + 1} of {expenseTable.getPageCount()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => expenseTable.previousPage()}
                      disabled={!expenseTable.getCanPreviousPage()}
                      className="p-1.5 border border-gray-300 text-gray-500 hover:text-gray-900 rounded-lg disabled:opacity-30 transition-colors bg-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => expenseTable.nextPage()}
                      disabled={!expenseTable.getCanNextPage()}
                      className="p-1.5 border border-gray-300 text-gray-500 hover:text-gray-900 rounded-lg disabled:opacity-30 transition-colors bg-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-small">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {fuelTable.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                        {hg.headers.map((h) => (
                          <th key={h.id} className="px-6 py-4 select-none">
                            {h.isPlaceholder
                              ? null
                              : flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {fuelTable.getRowModel().rows.length > 0 ? (
                      fuelTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors h-[52px]">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-6 py-3 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={fuelColumns.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                          No fuel purchase logs registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {fuelTable.getPageCount() > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/20 text-xs">
                  <span className="text-gray-500 font-medium">
                    Showing page {fuelTable.getState().pagination.pageIndex + 1} of {fuelTable.getPageCount()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fuelTable.previousPage()}
                      disabled={!fuelTable.getCanPreviousPage()}
                      className="p-1.5 border border-gray-300 text-gray-500 hover:text-gray-900 rounded-lg disabled:opacity-30 transition-colors bg-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fuelTable.nextPage()}
                      disabled={!fuelTable.getCanNextPage()}
                      className="p-1.5 border border-gray-300 text-gray-500 hover:text-gray-900 rounded-lg disabled:opacity-30 transition-colors bg-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fuel Log Modal */}
      <FuelLogDialogForm
        isOpen={isFuelOpen}
        onClose={() => {
          setIsFuelOpen(false);
          router.refresh();
        }}
        vehicles={vehicles}
        trips={trips}
      />

      {/* Expense Modal */}
      <ExpenseDialogForm
        isOpen={isExpenseOpen}
        onClose={() => {
          setIsExpenseOpen(false);
          router.refresh();
        }}
        vehicles={vehicles}
      />
    </div>
  );
}
