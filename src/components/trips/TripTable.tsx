"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { TripStatus } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { TripWizardForm } from "./TripWizardForm";
import { TripDispatchModal } from "./TripDispatchModal";
import { TripCompleteModal } from "./TripCompleteModal";
import { cancelTripAction } from "@/actions/trip.actions";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  FilterX,
  Play,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelConsumed: number | null;
  revenue: number;
  status: TripStatus;
  createdAt: Date;
  dispatchedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  vehicle: {
    registrationNumber: string;
    name: string;
    odometer: number;
  };
  driver: {
    name: string;
    licenseCategory: string;
    safetyScore: number;
  };
}

interface VehicleSummary {
  id: string;
  name: string;
  registrationNumber: string;
  odometer: number;
}

interface DriverSummary {
  id: string;
  name: string;
  licenseCategory: string;
  safetyScore: number;
}

interface TripTableProps {
  initialTrips: Trip[];
  availableVehicles: VehicleSummary[];
  availableDrivers: DriverSummary[];
}

export function TripTable({ initialTrips, availableVehicles, availableDrivers }: TripTableProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userDriverId = session?.user?.driverId;

  const canCreate = hasPermission(userRole, "MANAGE_TRIPS") && userRole !== "DRIVER";

  const [data, setData] = useState<Trip[]>(initialTrips);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showOnlyMine, setShowOnlyMine] = useState(userRole === "DRIVER");

  // Wizard & Modals State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);

  const handleCancel = async (tripId: string) => {
    if (!confirm("Are you sure you want to cancel this trip?")) {
      return;
    }

    try {
      const res = await cancelTripAction(tripId);
      if (res.success) {
        setData((prev) =>
          prev.map((t) => (t.id === tripId ? { ...t, status: TripStatus.CANCELLED, cancelledAt: new Date() } : t))
        );
      } else {
        alert(res.error || "Failed to cancel trip.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while cancelling trip.");
    }
  };

  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
    setShowOnlyMine(false);
  };

  // Local filtering logic
  const filteredTrips = useMemo(() => {
    return data.filter((t) => {
      // Global search: location, vehicle, driver
      const matchesSearch =
        globalFilter === "" ||
        t.source.toLowerCase().includes(globalFilter.toLowerCase()) ||
        t.destination.toLowerCase().includes(globalFilter.toLowerCase()) ||
        t.vehicle.registrationNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
        t.driver.name.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesStatus = selectedStatus === "" || t.status === selectedStatus;
      
      const matchesMine = !showOnlyMine || t.driverId === userDriverId;

      return matchesSearch && matchesStatus && matchesMine;
    });
  }, [data, globalFilter, selectedStatus, showOnlyMine, userDriverId]);

  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-slate-400">
            {info.getValue() as string ? (info.getValue() as string).substring(0, 8).toUpperCase() : ""}
          </span>
        ),
      },
      {
        accessorKey: "source",
        header: "Route details",
        cell: (info) => {
          const trip = info.row.original;
          return (
            <div>
              <div className="flex items-center gap-1.5 text-slate-100 font-medium">
                <span>{trip.source}</span>
                <span className="text-slate-500 font-normal">&rarr;</span>
                <span>{trip.destination}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
                Est: {trip.plannedDistance.toLocaleString()} km
              </div>
            </div>
          );
        },
      },
      {
        id: "vehicle",
        header: "Vehicle Plate",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-indigo-400 text-sm">
              {row.original.vehicle.registrationNumber}
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{row.original.vehicle.name}</span>
          </div>
        ),
      },
      {
        id: "driver",
        header: "Driver name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-200">{row.original.driver.name}</span>
            <span className="text-[10px] text-slate-500">Score: {row.original.driver.safetyScore}/100</span>
          </div>
        ),
      },
      {
        accessorKey: "cargoWeight",
        header: "Cargo Weight",
        cell: (info) => <span className="text-slate-300 font-medium">{(info.getValue() as number).toLocaleString()} kg</span>,
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Est. Revenue
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => (
          <span className="font-bold text-emerald-400">
            ${(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue() as TripStatus} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const trip = row.original;
          const isDraft = trip.status === TripStatus.DRAFT;
          const isDispatched = trip.status === TripStatus.DISPATCHED;
          
          // Role authorization checks
          const isAssignedDriver = userDriverId === trip.driverId;
          const isManager = userRole === "ADMIN" || userRole === "FLEET_MANAGER";
          
          const canDispatch = isDraft && (isManager || isAssignedDriver);
          const canComplete = isDispatched && (isManager || isAssignedDriver);
          const canCancel = isDraft && isManager;

          return (
            <div className="flex items-center justify-end gap-2">
              {canDispatch && (
                <button
                  onClick={() => setDispatchTrip(trip)}
                  className="px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10 scale-95 hover:scale-100"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Dispatch
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => setCompleteTrip(trip)}
                  className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-600/10 scale-95 hover:scale-100"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleCancel(trip.id)}
                  title="Cancel trip"
                  className="p-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-500/10 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
              {!canDispatch && !canComplete && !canCancel && (
                <span className="text-slate-600 text-xs italic">view only</span>
              )}
            </div>
          );
        },
      },
    ],
    [userRole, userDriverId]
  );

  const table = useReactTable({
    data: filteredTrips,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search dispatch hub, driver, vehicle..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="">All Statuses</option>
            <option value={TripStatus.DRAFT}>Draft</option>
            <option value={TripStatus.DISPATCHED}>Dispatched</option>
            <option value={TripStatus.COMPLETED}>Completed</option>
            <option value={TripStatus.CANCELLED}>Cancelled</option>
          </select>

          {/* Assigned to me toggle */}
          {userRole === "DRIVER" && (
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyMine}
                onChange={(e) => setShowOnlyMine(e.target.checked)}
                className="rounded border-slate-800 text-indigo-500 focus:ring-indigo-500/50 bg-slate-950"
              />
              Assigned dispatches only
            </label>
          )}

          {/* Clear Filters */}
          {(globalFilter || selectedStatus || showOnlyMine !== (userRole === "DRIVER")) && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center border border-slate-700"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {/* Create Trip Wizard Trigger */}
          {canCreate && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/15 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Register Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Table container */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-850 bg-slate-950/20 text-xs font-semibold text-slate-400 uppercase">
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
            <tbody className="divide-y divide-slate-850 text-sm">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-850/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No active dispatches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {table.getPageCount() > 1 && (
          <div className="px-6 py-4 border-t border-slate-850 flex items-center justify-between bg-slate-950/10 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Form Modal */}
      <TripWizardForm
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          window.location.reload();
        }}
        availableVehicles={availableVehicles}
        availableDrivers={availableDrivers}
      />

      {/* Dispatch Modal */}
      <TripDispatchModal
        isOpen={!!dispatchTrip}
        onClose={() => {
          setDispatchTrip(null);
          window.location.reload();
        }}
        trip={dispatchTrip}
      />

      {/* Complete Modal */}
      <TripCompleteModal
        isOpen={!!completeTrip}
        onClose={() => {
          setCompleteTrip(null);
          window.location.reload();
        }}
        trip={completeTrip}
      />
    </div>
  );
}
