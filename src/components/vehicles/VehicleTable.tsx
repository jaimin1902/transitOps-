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
  createdAt: Date;
}

interface VehicleTableProps {
  initialVehicles: Vehicle[];
  uniqueTypes: string[];
  uniqueRegions: string[];
}

export function VehicleTable({ initialVehicles, uniqueTypes, uniqueRegions }: VehicleTableProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = hasPermission(userRole, "MANAGE_VEHICLES");

  const [data, setData] = useState<Vehicle[]>(initialVehicles);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleRetire = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to retire this vehicle? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await retireVehicleAction(vehicleId);
      if (res.success) {
        // Update local state
        setData((prev) =>
          prev.map((v) => (v.id === vehicleId ? { ...v, status: VehicleStatus.RETIRED } : v))
        );
      } else {
        alert(res.error || "Failed to retire vehicle.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while retiring the vehicle.");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
    setSelectedType("");
    setSelectedRegion("");
  };

  // Filter vehicles locally based on state dropdowns
  const filteredVehicles = useMemo(() => {
    return data.filter((v) => {
      // Global text filter (registrationNumber, name, type)
      const matchesSearch =
        globalFilter === "" ||
        v.registrationNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
        v.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        v.type.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesStatus = selectedStatus === "" || v.status === selectedStatus;
      const matchesType = selectedType === "" || v.type.toLowerCase() === selectedType.toLowerCase();
      const matchesRegion =
        selectedRegion === "" ||
        (v.region && v.region.toLowerCase() === selectedRegion.toLowerCase());

      return matchesSearch && matchesStatus && matchesType && matchesRegion;
    });
  }, [data, globalFilter, selectedStatus, selectedType, selectedRegion]);

  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      {
        accessorKey: "registrationNumber",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Plate No.
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => (
          <span className="font-mono font-bold text-slate-200">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name / Model
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => <span className="font-semibold text-slate-100">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => <span className="text-slate-400 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: (info) => (
          <span className="text-slate-400 text-sm">
            {(info.getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "maxLoadCapacity",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Load Limit
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => {
          const kg = info.getValue() as number;
          return <span className="text-slate-200 font-medium">{kg.toLocaleString()} kg</span>;
        },
      },
      {
        accessorKey: "odometer",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Odometer
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => {
          const val = info.getValue() as number;
          return <span className="text-slate-300 font-medium">{val.toLocaleString()} km</span>;
        },
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
            <div className="flex items-center justify-end gap-2.5">
              <Link
                href={`/vehicles/${vehicle.id}`}
                title="View details"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </Link>
              {canManage && (
                <>
                  <button
                    onClick={() => handleEdit(vehicle)}
                    title="Edit vehicle"
                    className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRetire(vehicle.id)}
                    disabled={isTrip || isRetired}
                    title={isTrip ? "Cannot retire on-trip vehicles" : isRetired ? "Already retired" : "Retire vehicle"}
                    className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
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
            placeholder="Search vehicle model, plate..."
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
            <option value={VehicleStatus.AVAILABLE}>Available</option>
            <option value={VehicleStatus.ON_TRIP}>On Trip</option>
            <option value={VehicleStatus.IN_SHOP}>In Shop</option>
            <option value={VehicleStatus.RETIRED}>Retired</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
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
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
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
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center border border-slate-700"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {/* New Vehicle Button */}
          {canManage && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/15 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
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
                    No matching vehicles found.
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

      {/* Form Dialog */}
      <VehicleDialogForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingVehicle(null);
          // Refetch from server (simple window reload or custom state sync is standard in this structure)
          window.location.reload();
        }}
        vehicle={editingVehicle}
      />
    </div>
  );
}
