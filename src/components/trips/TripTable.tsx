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
  Eye,
} from "lucide-react";
import Link from "next/link";

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
  status: TripStatus;
  revenue: number;
  vehicle: {
    registrationNumber: string;
    name: string;
    odometer: number;
  };
  driver: {
    name: string;
    safetyScore: number;
  };
}

interface VehicleSummary {
  id: string;
  name: string;
  registrationNumber: string;
  maxLoadCapacity?: number;
  odometer?: number;
}

interface DriverSummary {
  id: string;
  name: string;
  licenseCategory?: string;
  safetyScore?: number;
}

interface TripTableProps {
  initialTrips: Trip[];
  availableVehicles: VehicleSummary[];
  availableDrivers: DriverSummary[];
  userDriverId?: string | null;
}

export function TripTable({ initialTrips, availableVehicles, availableDrivers, userDriverId }: TripTableProps) {
  const trips = initialTrips;
  const vehicles = availableVehicles;
  const drivers = availableDrivers;
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canCreate = hasPermission(userRole, "MANAGE_TRIPS");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showOnlyMine, setShowOnlyMine] = useState(userRole === "DRIVER");

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);

  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
    setShowOnlyMine(userRole === "DRIVER");
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this trip dispatch?")) {
      return;
    }

    try {
      const res = await cancelTripAction(id);
      if (res.success) {
        alert("Dispatch cancelled successfully.");
        window.location.reload();
      } else {
        alert(res.error || "Failed to cancel trip.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected system error occurred.");
    }
  };

  // Filter local logic
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      // 1. Text Search query
      if (globalFilter.trim().length > 0) {
        const query = globalFilter.toLowerCase();
        const matchesSrc = t.source.toLowerCase().includes(query);
        const matchesDst = t.destination.toLowerCase().includes(query);
        const matchesPlate = t.vehicle.registrationNumber.toLowerCase().includes(query);
        const matchesDriver = t.driver.name.toLowerCase().includes(query);
        if (!matchesSrc && !matchesDst && !matchesPlate && !matchesDriver) return false;
      }

      // 2. Status filter
      if (selectedStatus && t.status !== selectedStatus) return false;

      // 3. Driver assignment filter
      if (showOnlyMine && t.driverId !== userDriverId) return false;

      return true;
    });
  }, [trips, globalFilter, selectedStatus, showOnlyMine, userDriverId]);

  // TanStack columns
  const columns = useMemo<ColumnDef<Trip>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Trip ID",
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-gray-400">
            {(info.getValue() as string).substring(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        id: "route",
        header: "Route details",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
            <span>{row.original.source}</span>
            <span className="text-gray-400 mx-1.5">&rarr;</span>
            <span>{row.original.destination}</span>
          </div>
        ),
      },
      {
        id: "vehicle",
        header: "Vehicle Plate",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-indigo-600 text-xs">
              {row.original.vehicle.registrationNumber}
            </span>
            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{row.original.vehicle.name}</span>
          </div>
        ),
      },
      {
        id: "driver",
        header: "Driver name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{row.original.driver.name}</span>
            <span className="text-[10px] text-gray-450 font-medium">Score: {row.original.driver.safetyScore}/100</span>
          </div>
        ),
      },
      {
        accessorKey: "cargoWeight",
        header: "Cargo Weight",
        cell: (info) => <span className="text-gray-700 font-semibold">{(info.getValue() as number).toLocaleString()} kg</span>,
      },
      {
        accessorKey: "revenue",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900 font-bold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Est. Revenue
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => (
          <span className="font-bold text-emerald-600">
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
          
          const isAssignedDriver = userDriverId === trip.driverId;
          const isManager = userRole === "ADMIN" || userRole === "FLEET_MANAGER";
          
          const canDispatch = isDraft && (isManager || isAssignedDriver);
          const canComplete = isDispatched && (isManager || isAssignedDriver);
          const canCancel = isDraft && isManager;

          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/trips/${trip.id}`}
                title="View trip detail"
                className="p-1.5 bg-white border border-gray-300 hover:border-primary-300 text-gray-500 hover:text-primary-500 rounded-lg transition-colors shadow-small"
              >
                <Eye className="w-4 h-4" />
              </Link>
              {canDispatch && (
                <button
                  onClick={() => setDispatchTrip(trip)}
                  className="h-8 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-xs font-bold transition-colors flex items-center gap-1 shadow-small"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Dispatch
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => setCompleteTrip(trip)}
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button text-xs font-bold transition-colors flex items-center gap-1 shadow-small"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => handleCancel(trip.id)}
                  title="Cancel trip"
                  className="p-1.5 bg-white border border-gray-300 hover:border-red-300 text-gray-450 hover:text-red-500 rounded-lg transition-colors shadow-small"
                >
                  <XCircle className="w-4 h-4" />
                </button>
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
    <div className="space-y-6 text-left">
      {/* Header controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search dispatch hub, driver, vehicle..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all shadow-inner"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[42px] px-3.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none pr-8 relative select-arrow"
          >
            <option value="">All Statuses</option>
            <option value={TripStatus.DRAFT}>Draft</option>
            <option value={TripStatus.DISPATCHED}>Dispatched</option>
            <option value={TripStatus.COMPLETED}>Completed</option>
            <option value={TripStatus.CANCELLED}>Cancelled</option>
          </select>

          {/* Assigned to me toggle */}
          {userRole === "DRIVER" && (
            <label className="flex items-center gap-2 h-[42px] px-3.5 bg-white border border-gray-300 text-gray-750 text-sm rounded-input cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyMine}
                onChange={(e) => setShowOnlyMine(e.target.checked)}
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              Assigned dispatches only
            </label>
          )}

          {/* Clear Filters */}
          {(globalFilter || selectedStatus || showOnlyMine !== (userRole === "DRIVER")) && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="h-10 px-3 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-button transition-colors flex items-center justify-center shadow-small"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {/* Create Trip Wizard Trigger */}
          {canCreate && (
            <button
              onClick={() => setIsWizardOpen(true)}
              className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small"
            >
              <Plus className="w-4 h-4" />
              Register dispatch
            </button>
          )}
        </div>
      </div>

      {/* Table container */}
      <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-200 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/40 transition-colors h-[52px]">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-3.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No matching trip dispatches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {table.getPageCount() > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/20 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary-500 rounded-button disabled:opacity-40 shadow-small transition-colors flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary-500 rounded-button disabled:opacity-40 shadow-small transition-colors flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trip Forms */}
      <TripWizardForm
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          window.location.reload();
        }}
        vehicles={vehicles}
        drivers={drivers}
      />

      {dispatchTrip && (
        <TripDispatchModal
          isOpen={!!dispatchTrip}
          onClose={() => {
            setDispatchTrip(null);
            window.location.reload();
          }}
          trip={{
            id: dispatchTrip.id,
            vehicle: {
              registrationNumber: dispatchTrip.vehicle.registrationNumber,
              name: dispatchTrip.vehicle.name,
              odometer: dispatchTrip.vehicle.odometer ?? 0,
            },
          }}
        />
      )}

      {completeTrip && (
        <TripCompleteModal
          isOpen={!!completeTrip}
          onClose={() => {
            setCompleteTrip(null);
            window.location.reload();
          }}
          trip={{
            id: completeTrip.id,
            startOdometer: completeTrip.startOdometer,
            plannedDistance: completeTrip.plannedDistance,
            vehicle: {
              name: completeTrip.vehicle.name,
              registrationNumber: completeTrip.vehicle.registrationNumber,
            },
          }}
        />
      )}
    </div>
  );
}
