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
import { DriverStatus } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { DriverDialogForm } from "./DriverDialogForm";
import { suspendDriverAction } from "@/actions/driver.actions";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac";
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  FilterX,
  AlertTriangle,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  userId: string | null;
}

interface UnlinkedUser {
  id: string;
  name: string;
  email: string;
}

interface DriverTableProps {
  initialDrivers: Driver[];
  unlinkedUsers: UnlinkedUser[];
}

export function DriverTable({ initialDrivers, unlinkedUsers }: DriverTableProps) {
  const drivers = initialDrivers;
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = hasPermission(userRole, "MANAGE_DRIVERS");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Handle driver suspension mutation
  const handleSuspend = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this driver? This blocks them from trips.")) {
      return;
    }

    try {
      const res = await suspendDriverAction(id);
      if (res.success) {
        alert("Driver suspended successfully.");
        window.location.reload();
      } else {
        alert(res.error || "Failed to suspend driver.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingDriver(null);
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
  };

  // Filter local logic
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      // 1. Text Search query
      if (globalFilter.trim().length > 0) {
        const query = globalFilter.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(query);
        const matchesLic = d.licenseNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesLic) return false;
      }

      // 2. Status check
      if (selectedStatus && d.status !== selectedStatus) return false;

      return true;
    });
  }, [drivers, globalFilter, selectedStatus]);

  // TanStack columns
  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 transition-colors font-bold"
          >
            Driver Name
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <Link
            href={`/drivers/${info.row.original.id}`}
            className="font-bold text-gray-900 hover:text-primary-600 hover:underline transition-colors"
          >
            {info.getValue() as string}
          </Link>
        ),
      },
      {
        accessorKey: "licenseNumber",
        header: "License No.",
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-indigo-600">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "licenseCategory",
        header: "Class Category",
        cell: (info) => (
          <span className="px-2 py-0.5 rounded bg-gray-150 text-[10px] font-bold text-gray-600 uppercase">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "licenseExpiryDate",
        header: "Expiry Date",
        cell: (info) => {
          const expiry = new Date(info.getValue() as Date);
          const now = new Date();
          const warningLimit = new Date();
          warningLimit.setDate(now.getDate() + 30);

          const isExpired = expiry < now;
          const isExpiringSoon = !isExpired && expiry <= warningLimit;

          return (
            <div className="flex items-center gap-1.5">
              <span className={isExpired ? "text-rose-600 font-bold" : isExpiringSoon ? "text-amber-600 font-bold" : "text-gray-700 font-medium"}>
                {expiry.toLocaleDateString()}
              </span>
              {isExpired && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />}
              {isExpiringSoon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </div>
          );
        },
      },
      {
        accessorKey: "contactNumber",
        header: "Contact No.",
        cell: (info) => <span className="text-gray-500 text-sm font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "safetyScore",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900 font-bold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Safety Score
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => {
          const score = info.getValue() as number;
          let color = "text-emerald-600";
          if (score < 70) color = "text-rose-600 font-extrabold";
          else if (score < 85) color = "text-amber-600 font-bold";

          return (
            <span className={`text-sm font-semibold ${color}`}>
              {score} / 100
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue() as DriverStatus} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const driver = row.original;
          const isOnTrip = driver.status === DriverStatus.ON_TRIP;
          const isSuspended = driver.status === DriverStatus.SUSPENDED;

          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/drivers/${driver.id}`}
                title="View driver profile"
                className="p-1.5 bg-white border border-gray-300 hover:border-primary-300 text-gray-500 hover:text-primary-500 rounded-lg transition-colors shadow-small"
              >
                <Eye className="w-4 h-4" />
              </Link>
              {canManage && (
                <>
                  <button
                    onClick={() => handleEdit(driver)}
                    title="Edit driver"
                    className="p-1.5 bg-white border border-gray-300 hover:border-primary-300 text-gray-500 hover:text-primary-500 rounded-lg transition-colors shadow-small"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSuspend(driver.id)}
                    disabled={isOnTrip || isSuspended}
                    title={isOnTrip ? "Cannot suspend driver on a trip" : isSuspended ? "Already suspended" : "Suspend driver"}
                    className="p-1.5 bg-white border border-gray-300 hover:border-red-300 text-gray-450 hover:text-red-650 disabled:opacity-30 rounded-lg transition-colors shadow-small"
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
    data: filteredDrivers,
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
            placeholder="Search driver name, license..."
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
            <option value={DriverStatus.AVAILABLE}>Available</option>
            <option value={DriverStatus.ON_TRIP}>On Trip</option>
            <option value={DriverStatus.OFF_DUTY}>Off Duty</option>
            <option value={DriverStatus.SUSPENDED}>Suspended</option>
          </select>

          {/* Clear Filters */}
          {(globalFilter || selectedStatus) && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="h-10 px-3 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-button transition-colors flex items-center justify-center shadow-small"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {/* New Driver Button */}
          {canManage && (
            <button
              onClick={handleCreate}
              className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small"
            >
              <Plus className="w-4 h-4" />
              Add driver
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
                    No matching drivers found.
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
      <DriverDialogForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingDriver(null);
          window.location.reload();
        }}
        driver={editingDriver}
        unlinkedUsers={unlinkedUsers}
      />
    </div>
  );
}
