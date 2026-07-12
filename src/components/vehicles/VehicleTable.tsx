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
import { VehicleStatus } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { VehicleDialogForm } from "./VehicleDialogForm";
import { retireVehicleAction } from "@/actions/vehicle.actions";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";
import {
  Search,
  Edit2,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  FilterX,
} from "lucide-react";

interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string | null;
}

interface VehicleTableProps {
  initialVehicles: Vehicle[];
}

export function VehicleTable({ initialVehicles }: VehicleTableProps) {
  const vehicles = initialVehicles;
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = hasPermission(userRole, "MANAGE_VEHICLES");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Dynamic filter sets
  const uniqueTypes = useMemo(() => {
    const types = vehicles.map((v) => v.type);
    return Array.from(new Set(types)).sort();
  }, [vehicles]);

  const uniqueRegions = useMemo(() => {
    const regions = vehicles.map((v) => v.region).filter(Boolean) as string[];
    return Array.from(new Set(regions)).sort();
  }, [vehicles]);

  // Handle vehicle retirement mutation
  const handleRetire = async (id: string) => {
    if (!confirm("Are you sure you want to retire this vehicle? This action is permanent.")) {
      return;
    }

    try {
      const res = await retireVehicleAction(id);
      if (res.success) {
        alert("Vehicle retired successfully.");
        window.location.reload();
      } else {
        alert(res.error || "Failed to retire vehicle.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
    setSelectedType("");
    setSelectedRegion("");
  };

  // Filter local logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // 1. Text Search query
      if (globalFilter.trim().length > 0) {
        const query = globalFilter.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(query);
        const matchesReg = v.registrationNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesReg) return false;
      }

      // 2. Status check
      if (selectedStatus && v.status !== selectedStatus) return false;

      // 3. Type check
      if (selectedType && v.type !== selectedType) return false;

      // 4. Region check
      if (selectedRegion && v.region !== selectedRegion) return false;

      return true;
    });
  }, [vehicles, globalFilter, selectedStatus, selectedType, selectedRegion]);

  // TanStack columns
  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      {
        accessorKey: "registrationNumber",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 transition-colors uppercase font-bold"
          >
            Plate Number
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-indigo-600">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Vehicle name",
        cell: (info) => <span className="font-bold text-gray-950">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "type",
        header: "Model category",
        cell: (info) => <span className="text-gray-500 font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "region",
        header: "Operational region",
        cell: (info) => <span className="text-gray-500 font-semibold">{info.getValue() as string || "National"}</span>,
      },
      {
        accessorKey: "maxLoadCapacity",
        header: "Load cap (kg)",
        cell: (info) => (
          <span className="font-semibold text-gray-700">
            {(info.getValue() as number).toLocaleString()} kg
          </span>
        ),
      },
      {
        accessorKey: "odometer",
        header: "Odometer reading",
        cell: (info) => (
          <span className="font-mono text-xs text-gray-600 font-semibold">
            {(info.getValue() as number).toLocaleString()} km
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue() as VehicleStatus} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const vehicle = row.original;
          const isTrip = vehicle.status === VehicleStatus.ON_TRIP;
          const isRetired = vehicle.status === VehicleStatus.RETIRED;

          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/vehicles/${vehicle.id}`}
                title="View details"
                className="p-1.5 bg-white border border-gray-300 hover:border-primary-300 text-gray-500 hover:text-primary-500 rounded-lg transition-colors shadow-small"
              >
                <Eye className="w-4 h-4" />
              </Link>
              {canManage && (
                <>
                  <button
                    onClick={() => handleEdit(vehicle)}
                    title="Edit vehicle"
                    className="p-1.5 bg-white border border-gray-300 hover:border-primary-300 text-gray-500 hover:text-primary-500 rounded-lg transition-colors shadow-small"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRetire(vehicle.id)}
                    disabled={isTrip || isRetired}
                    title={isTrip ? "Cannot retire on-trip vehicles" : isRetired ? "Already retired" : "Retire vehicle"}
                    className="p-1.5 bg-white border border-gray-300 hover:border-red-300 text-gray-400 hover:text-red-500 disabled:opacity-30 rounded-lg transition-colors shadow-small"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [canManage]
  );

  const table = useReactTable({
    data: filteredVehicles,
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
            placeholder="Search vehicle model, plate..."
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
            <option value={VehicleStatus.AVAILABLE}>Available</option>
            <option value={VehicleStatus.ON_TRIP}>On Trip</option>
            <option value={VehicleStatus.IN_SHOP}>In Shop</option>
            <option value={VehicleStatus.RETIRED}>Retired</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-[42px] px-3.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none pr-8 relative select-arrow"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="h-[42px] px-3.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none pr-8 relative select-arrow"
          >
            <option value="">All Regions</option>
            {uniqueRegions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(globalFilter || selectedStatus || selectedType || selectedRegion) && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="h-10 px-3 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-button transition-colors flex items-center justify-center shadow-small"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {/* New Vehicle Button */}
          {canManage && (
            <button
              onClick={handleCreate}
              className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small"
            >
              <Plus className="w-4 h-4" />
              Add vehicle
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
                    No matching vehicles found.
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

      {/* Form Dialog */}
      <VehicleDialogForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingVehicle(null);
          window.location.reload();
        }}
        vehicle={editingVehicle}
      />
    </div>
  );
}
