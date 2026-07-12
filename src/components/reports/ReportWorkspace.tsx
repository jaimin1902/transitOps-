"use client";

import React, { useState, useTransition, useMemo } from "react";
import { getReportDataAction } from "@/actions/report.actions";
import Papa from "papaparse";
import {
  Download,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

type ReportType = "trips" | "maintenance" | "expenses" | "fuel";

interface ReportRow {
  id: string;
  source: string;
  destination: string;
  vehiclePlate: string;
  vehicleName: string;
  driverName: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number;
  revenue: number;
  estimatedExpenses: number;
  netProfit: number;
  status: string;
  type: string;
  cost: number;
  amount: number;
  startDate: string;
  endDate: string;
  description: string;
  date: string;
  liters: number;
  tripRoute: string;
}

interface ReportWorkspaceProps {
  initialData: Record<string, unknown>[];
  initialType: ReportType;
}

export function ReportWorkspace({ initialData, initialType }: ReportWorkspaceProps) {
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ReportRow[]>(initialData as unknown as ReportRow[]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFilter = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await getReportDataAction(reportType, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        if (res.success && res.data) {
          setData(res.data as unknown as ReportRow[]);
        } else {
          setError(res.error || "Failed to load report data.");
        }
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred while filtering reports.");
      }
    });
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert("No data available to export.");
      return;
    }

    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `TransitOps_${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export report CSV.");
    }
  };

  // Define column render structures matching active reportType
  const headers = useMemo(() => {
    if (reportType === "trips") {
      return ["ID", "Route source & destination", "Vehicle plate", "Operator", "Cargo Capacity", "Revenue", "Estimated Cost", "Net profit", "Status"];
    } else if (reportType === "maintenance") {
      return ["ID", "Vehicle plate", "Service type", "Cost bill", "Date started", "Date resolved", "Status"];
    } else if (reportType === "expenses") {
      return ["ID", "Vehicle plate", "Category", "Amount spent", "Record Date", "Description"];
    } else {
      return ["ID", "Vehicle plate", "Volume (Liters)", "Total Cost", "Associated Route", "Purchase Date"];
    }
  }, [reportType]);

  return (
    <div className="space-y-6">
      {/* Control Card Filters */}
      <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4 text-left">
        <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wider">
          <Filter className="w-4.5 h-4.5" />
          Report parameters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Report Type Dropdown */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
              Select Workspace registry
            </label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as ReportType);
                setData([]);
              }}
              className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors select-arrow cursor-pointer"
            >
              <option value="trips">Logistics dispatches (Trips)</option>
              <option value="maintenance">Mechanical services (Maintenance)</option>
              <option value="expenses">Financial expenses (General)</option>
              <option value="fuel">Fuel audit logs (Fuel)</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Trigger Filter Action */}
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              disabled={isPending}
              className="flex-1 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4.5 h-4.5" />
              )}
              Generate
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isPending || data.length === 0}
              className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-button text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-small disabled:opacity-40"
              title="Download CSV report"
            >
              <Download className="w-4.5 h-4.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-input text-left">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Report Listing grid */}
      <div className="bg-white border border-gray-200 rounded-card shadow-small overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {headers.map((h, i) => (
                  <th key={i} className="px-6 py-4 select-none">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {data.length > 0 ? (
                data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/40 transition-colors h-[52px]">
                    {reportType === "trips" && (
                      <>
                        <td className="px-6 py-3 font-mono font-bold text-gray-400">{item.id}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900">
                          {item.source} &rarr; {item.destination}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-indigo-500 font-bold">{item.vehiclePlate}</td>
                        <td className="px-6 py-3 text-gray-700">{item.driverName}</td>
                        <td className="px-6 py-3 text-gray-500">{(item.cargoWeight || 0).toLocaleString()} kg</td>
                        <td className="px-6 py-3 font-bold text-emerald-600">${(item.revenue || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-red-500 font-medium">${(item.estimatedExpenses || 0).toLocaleString()}</td>
                        <td className={`px-6 py-3 font-extrabold ${item.netProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          ${(item.netProfit || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-xs uppercase font-bold text-gray-400">{item.status}</td>
                      </>
                    )}

                    {reportType === "maintenance" && (
                      <>
                        <td className="px-6 py-3 font-mono font-bold text-gray-400">{item.id}</td>
                        <td className="px-6 py-3 font-mono text-xs text-indigo-500 font-bold">{item.vehiclePlate}</td>
                        <td className="px-6 py-3 font-semibold text-gray-900">{item.type}</td>
                        <td className="px-6 py-3 font-bold text-rose-500">${(item.cost || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{new Date(item.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {item.endDate ? new Date(item.endDate).toLocaleDateString() : "active"}
                        </td>
                        <td className="px-6 py-3 text-xs uppercase font-bold text-gray-400">{item.status}</td>
                      </>
                    )}

                    {reportType === "expenses" && (
                      <>
                        <td className="px-6 py-3 font-mono font-bold text-gray-400">{item.id}</td>
                        <td className="px-6 py-3 font-mono text-xs text-indigo-500 font-bold">{item.vehiclePlate}</td>
                        <td className="px-6 py-3 font-semibold text-gray-700 uppercase text-xs">{item.type}</td>
                        <td className="px-6 py-3 font-bold text-rose-500">${(item.cost || item.amount || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-gray-500 truncate max-w-[200px]" title={item.description}>{item.description || "—"}</td>
                      </>
                    )}

                    {reportType === "fuel" && (
                      <>
                        <td className="px-6 py-3 font-mono font-bold text-gray-400">{item.id}</td>
                        <td className="px-6 py-3 font-mono text-xs text-indigo-500 font-bold">{item.vehiclePlate}</td>
                        <td className="px-6 py-3 text-gray-700 font-semibold">{(item.liters || 0).toLocaleString()} L</td>
                        <td className="px-6 py-3 font-bold text-rose-500">${(item.cost || 0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{item.tripRoute}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No report records found. Click &quot;Generate&quot; to load filtered registries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
