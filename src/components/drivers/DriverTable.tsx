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
} from "lucide-react";

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
  createdAt: Date;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
}

interface DriverTableProps {
  initialDrivers: Driver[];
  unlinkedUsers: UserSummary[];
}

export function DriverTable({ initialDrivers, unlinkedUsers }: DriverTableProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = hasPermission(userRole, "MANAGE_DRIVERS");

  const [data, setData] = useState<Driver[]>(initialDrivers);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingDriver(null);
    setIsDialogOpen(true);
  };

  const handleSuspend = async (driverId: string) => {
    if (!confirm("Are you sure you want to suspend this driver? They will be locked out of new dispatch assignments.")) {
      return;
    }

    try {
      const res = await suspendDriverAction(driverId);
      if (res.success) {
        setData((prev) =>
          prev.map((d) => (d.id === driverId ? { ...d, status: DriverStatus.SUSPENDED } : d))
        );
      } else {
        alert(res.error || "Failed to suspend driver.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while suspending driver.");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
  };

  // Filter drivers locally
  const filteredDrivers = useMemo(() => {
    return data.filter((d) => {
      const matchesSearch =
        globalFilter === "" ||
        d.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
        d.contactNumber.includes(globalFilter);

      const matchesStatus = selectedStatus === "" || d.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [data, globalFilter, selectedStatus]);

  const columns = useMemo<ColumnDef<Driver>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Driver Name
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => {
          const driver = info.row.original;
          const isExpired = new Date(driver.licenseExpiryDate) < new Date();
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-100">{driver.name}</span>
              {isExpired && (
                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Expired License
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "licenseNumber",
        header: "License No.",
        cell: (info) => <span className="font-mono text-slate-300 font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "licenseCategory",
        header: "Category",
        cell: (info) => <span className="text-slate-400 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "licenseExpiryDate",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            License Expiry
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => {
          const date = new Date(info.getValue() as Date);
          const isExpired = date < new Date();
          return (
            <span className={`text-sm ${isExpired ? "text-rose-400 font-bold" : "text-slate-300"}`}>
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "contactNumber",
        header: "Contact No.",
        cell: (info) => <span className="text-slate-400 text-sm font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "safetyScore",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white font-semibold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Safety Score
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => {
          const score = info.getValue() as number;
          let color = "text-emerald-400";
          if (score < 70) color = "text-rose-400 font-bold";
          else if (score < 85) color = "text-amber-400";

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
            <div className="flex items-center justify-end gap-2.5">
              {canManage && (
                <>
                  <button
                    onClick={() => handleEdit(driver)}
                    title="Edit driver"
                    className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSuspend(driver.id)}
                    disabled={isOnTrip || isSuspended}
                    title={isOnTrip ? "Cannot suspend driver on a trip" : isSuspended ? "Already suspended" : "Suspend driver"}
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
            placeholder="Search driver name, license..."
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
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center border border-slate-700"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {/* New Driver Button */}
          {canManage && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/15 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Driver
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
                    No matching drivers found.
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
      <DriverDialogForm
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingDriver(null);
          window.location.reload();
        }}
        unlinkedUsers={unlinkedUsers}
        driver={editingDriver}
      />
    </div>
  );
}
