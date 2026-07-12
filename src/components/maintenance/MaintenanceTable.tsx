"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { MaintenanceStatus } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import { MaintenanceDialogForm } from "./MaintenanceDialogForm";
import { MaintenanceResolveModal } from "./MaintenanceResolveModal";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  FilterX,
  CheckCircle,
  Eye,
} from "lucide-react";

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  description: string | null;
  cost: number;
  status: MaintenanceStatus;
  startDate: Date;
  endDate: Date | null;
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

interface MaintenanceTableProps {
  initialLogs: MaintenanceLog[];
  availableVehicles: VehicleSummary[];
}

export function MaintenanceTable({ initialLogs, availableVehicles }: MaintenanceTableProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canManage = hasPermission(userRole, "MANAGE_MAINTENANCE");

  const data = initialLogs;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [resolvingLog, setResolvingLog] = useState<MaintenanceLog | null>(null);

  const resetFilters = () => {
    setGlobalFilter("");
    setSelectedStatus("");
  };

  const filteredLogs = useMemo(() => {
    return data.filter((log) => {
      const matchesSearch =
        globalFilter === "" ||
        log.type.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (log.description && log.description.toLowerCase().includes(globalFilter.toLowerCase())) ||
        log.vehicle.registrationNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
        log.vehicle.name.toLowerCase().includes(globalFilter.toLowerCase());

      const matchesStatus = selectedStatus === "" || log.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [data, globalFilter, selectedStatus]);

  const columns = useMemo<ColumnDef<MaintenanceLog>[]>(
    () => [
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
        accessorKey: "type",
        header: "Service Type",
        cell: (info) => <span className="font-bold text-gray-900">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => {
          const desc = info.getValue() as string | null;
          return (
            <span className="text-gray-500 text-xs max-w-xs truncate block" title={desc || ""}>
              {desc || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: "Timeline",
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="text-xs text-gray-500 space-y-0.5">
              <div>Started: {new Date(log.startDate).toLocaleDateString()}</div>
              {log.endDate && (
                <div className="text-emerald-600 font-medium">Closed: {new Date(log.endDate).toLocaleDateString()}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cost",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900 font-bold transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cost
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        ),
        cell: (info) => (
          <span className="font-bold text-rose-500">
            ${(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue() as MaintenanceStatus} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const log = row.original;
          const isOpen = log.status === MaintenanceStatus.ACTIVE;

          return (
            <div className="flex items-center justify-end gap-2">
              <Link
                href={`/vehicles/${log.vehicleId}`}
                title="Inspect Vehicle asset"
                className="p-1.5 bg-white border border-gray-300 hover:border-primary-300 text-gray-500 hover:text-primary-500 rounded-lg transition-colors shadow-small"
              >
                <Eye className="w-4 h-4" />
              </Link>
              {canManage && isOpen && (
                <button
                  onClick={() => setResolvingLog(log)}
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button text-xs font-bold transition-colors flex items-center gap-1 shadow-small"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [canManage]
  );

  const table = useReactTable({
    data: filteredLogs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
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
            placeholder="Search plate, vehicle name, service type..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all shadow-inner"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[42px] px-3.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none pr-8 select-arrow"
          >
            <option value="">All Statuses</option>
            <option value={MaintenanceStatus.ACTIVE}>In Shop</option>
            <option value={MaintenanceStatus.COMPLETED}>Completed</option>
          </select>

          {(globalFilter || selectedStatus) && (
            <button onClick={resetFilters} title="Reset all filters"
              className="h-10 px-3 bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-button transition-colors flex items-center justify-center shadow-small">
              <FilterX className="w-4 h-4" />
            </button>
          )}

          {canManage && (
            <button onClick={() => setIsScheduleOpen(true)}
              className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small">
              <Plus className="w-4 h-4" />
              Schedule Maintenance
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
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                    No active maintenance logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/20 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">
              Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                className="h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary-500 rounded-button disabled:opacity-40 shadow-small transition-colors flex items-center justify-center">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                className="h-8 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary-500 rounded-button disabled:opacity-40 shadow-small transition-colors flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <MaintenanceDialogForm
        isOpen={isScheduleOpen}
        onClose={() => { setIsScheduleOpen(false); router.refresh(); }}
        vehicles={availableVehicles}
      />

      <MaintenanceResolveModal
        isOpen={!!resolvingLog}
        onClose={() => { setResolvingLog(null); router.refresh(); }}
        log={resolvingLog}
      />
    </div>
  );
}
