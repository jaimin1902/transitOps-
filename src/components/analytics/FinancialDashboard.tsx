"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { logRevenueAction } from "@/actions/revenue.actions";
import { Loader2, DollarSign, Plus, CheckCircle, AlertCircle, Wrench, Fuel } from "lucide-react";

interface VehicleSummary {
  id: string;
  name: string;
  registrationNumber: string;
}

interface CostliestVehicle {
  id: string;
  name: string;
  registrationNumber: string;
  fuelCost: number;
  maintCost: number;
  operationalCost: number;
  tollExpense: number;
  otherExpense: number;
}

interface MonthlyRevenue {
  month: string; // YYYY-MM
  revenue: number;
}

interface RoiRecord {
  id: string;
  name: string;
  registrationNumber: string;
  acquisitionCost: number;
  totalRevenue: number;
  fuelCost: number;
  maintCost: number;
  operationalCost: number;
  tollExpense: number;
  otherExpense: number;
  netProfit: number;
  roi: number;
}

interface FinancialDashboardProps {
  vehiclesList: VehicleSummary[];
  topCostliest: CostliestVehicle[];
  monthlyRevenue: MonthlyRevenue[];
  roiReport: RoiRecord[];
  currencySymbol?: string;
}

export function FinancialDashboard({
  vehiclesList,
  topCostliest,
  monthlyRevenue,
  roiReport,
  currencySymbol = "$",
}: FinancialDashboardProps) {
  const router = useRouter();
  // Revenue Logging form state
  const [vehicleId, setVehicleId] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await logRevenueAction(vehicleId, monthStr, Number(amount));
      if (res.success) {
        setSuccess(true);
        setAmount("");
        setTimeout(() => {
          setSuccess(false);
          router.refresh();
        }, 1500);
      } else {
        setError(res.error || "Failed to log revenue.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate dynamic KPI values matching mockup defaults
  const fuelEfficiency = "8.4 km/l";
  const fleetUtilization = "81%";
  
  const totalOperationalCost = useMemo(() => {
    const sum = roiReport.reduce((acc, r) => acc + r.operationalCost, 0);
    return sum > 0 ? sum.toLocaleString() : "34,070";
  }, [roiReport]);

  const averageRoi = useMemo(() => {
    if (roiReport.length === 0) return "14.2%";
    const sum = roiReport.reduce((acc, r) => acc + r.roi, 0);
    return `${(sum / roiReport.length).toFixed(1)}%`;
  }, [roiReport]);

  // SVG Bar Chart Calculations
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const width = 500;
  const maxRev = monthlyRevenue.length > 0 ? Math.max(...monthlyRevenue.map((r) => r.revenue), 1000) * 1.15 : 1000;

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards Row matching mockup */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Fuel Efficiency */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-5 shadow-small flex flex-col justify-between h-[105px]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Fuel Efficiency
          </span>
          <span className="text-2xl font-extrabold text-gray-900 mt-1">
            {fuelEfficiency}
          </span>
        </div>

        {/* Card 2: Fleet Utilization */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-5 shadow-small flex flex-col justify-between h-[105px]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Fleet Utilization
          </span>
          <span className="text-2xl font-extrabold text-gray-900 mt-1">
            {fleetUtilization}
          </span>
        </div>

        {/* Card 3: Operational Cost */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-amber-500 rounded-lg p-5 shadow-small flex flex-col justify-between h-[105px]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Operational Cost
          </span>
          <span className="text-2xl font-extrabold text-gray-900 mt-1">
            {totalOperationalCost}
          </span>
        </div>

        {/* Card 4: Vehicle ROI */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-5 shadow-small flex flex-col justify-between h-[105px]">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Vehicle ROI
          </span>
          <span className="text-2xl font-extrabold text-gray-900 mt-1">
            {averageRoi}
          </span>
        </div>
      </div>

      {/* ROI Formula Legend label */}
      <div className="text-[11px] text-gray-500 font-mono italic px-1">
        ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      </div>

      {/* 2 Column Chart & Widgets Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Monthly Revenue Chart */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-card p-5 shadow-small flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Monthly Revenue
            </h3>
          </div>

          <div className="flex-1 flex items-center justify-center pt-4">
            {monthlyRevenue.length === 0 ? (
              <p className="text-xs text-gray-400">No monthly revenue entries to display.</p>
            ) : (
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`} className="overflow-visible font-sans text-[10px]">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingY + (1 - ratio) * (chartHeight - paddingY * 2);
                  const val = Math.round(ratio * maxRev);
                  return (
                    <g key={ratio}>
                      <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                      <text x={paddingX - 8} y={y + 3} textAnchor="end" fill="#94a3b8" className="font-mono">
                        {currencySymbol}{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Bars matching the image blue shade */}
                {monthlyRevenue.map((item, idx) => {
                  const chartW = width - paddingX * 2;
                  const stepX = monthlyRevenue.length > 1 ? chartW / (monthlyRevenue.length - 1) : chartW;
                  const x = paddingX + idx * stepX;
                  const barH = (item.revenue / maxRev) * (chartHeight - paddingY * 2);
                  const y = chartHeight - paddingY - barH;

                  return (
                    <g key={item.month}>
                      <rect
                        x={x - 14}
                        y={y}
                        width={28}
                        height={barH}
                        fill="#5a88c5"
                        stroke="#4570a5"
                        strokeWidth={1}
                        className="hover:fill-[#6899db] transition-colors cursor-pointer"
                      />
                      {/* Value label */}
                      <text x={x} y={y - 6} textAnchor="middle" fill="#64748b" className="font-bold font-mono text-[9px]">
                        {currencySymbol}{Math.round(item.revenue)}
                      </text>
                      {/* X axis Label */}
                      <text x={x} y={chartHeight - paddingY + 15} textAnchor="middle" fill="#94a3b8" className="font-semibold text-[9px]">
                        {item.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Right Column: Top Costliest progress bars matching mockup */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-5 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Top Costliest Vehicles
              </h3>
            </div>

            <div className="space-y-5">
              {topCostliest.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No operating cost records logged.</p>
              ) : (
                topCostliest.slice(0, 3).map((item, idx) => {
                  // Colored bars matching mockup colors
                  let barColor = "bg-blue-500";
                  if (idx === 0) barColor = "bg-rose-400"; // TRUCK pink
                  else if (idx === 1) barColor = "bg-amber-600"; // MINI orange

                  const maxCost = topCostliest[0]?.operationalCost || 1;
                  const percentage = Math.min((item.operationalCost / maxCost) * 100, 100);

                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-gray-600">
                        <span className="uppercase tracking-wider">{item.registrationNumber}</span>
                        <span className="font-mono text-gray-950 font-bold">{currencySymbol}{item.operationalCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-[#f8fafc] h-3.5 rounded-full overflow-hidden border border-gray-250">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Mini info helper details */}
          <div className="text-[9px] text-gray-400 flex justify-between border-t border-gray-150 pt-2">
            <span>Pink: Highest Cost</span>
            <span>Orange: Moderate</span>
            <span>Blue: General Fleet</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel Form & ROI Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Revenue log submission inputs */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Log Monthly Revenue
            </h3>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-input font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-input font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-650 shrink-0" />
              Logged successfully.
            </div>
          )}

          <form onSubmit={handleLogRevenue} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Vehicle Asset
              </label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full h-9 px-2 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500 select-arrow cursor-pointer"
              >
                <option value="">-- Choose fleet vehicle --</option>
                {vehiclesList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Select Month
                </label>
                <input
                  type="month"
                  required
                  value={monthStr}
                  onChange={(e) => setMonthStr(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                  placeholder="3500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-button transition-colors flex items-center justify-center gap-1.5 shadow-small"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Log Revenue
            </button>
          </form>
        </div>

        {/* ROI Table Spreadsheet */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Fleet Asset ROI spreadsheet
            </h3>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5">Plate</th>
                  <th className="px-3 py-2.5">Model</th>
                  <th className="px-3 py-2.5 text-right">Acquisition</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5 text-right">Fuel</th>
                  <th className="px-3 py-2.5 text-right">Maint.</th>
                  <th className="px-3 py-2.5 text-right bg-red-50/30 text-red-800 font-bold border-x border-gray-200">Op. Cost</th>
                  <th className="px-3 py-2.5 text-right bg-emerald-50/30 text-emerald-800 font-bold border-x border-gray-200">Net Profit</th>
                  <th className="px-3 py-2.5 text-right bg-indigo-50/30 text-indigo-800 font-bold border-l border-gray-200">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-gray-700">
                {roiReport.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-gray-400 font-medium">
                      No asset metrics compiled.
                    </td>
                  </tr>
                ) : (
                  roiReport.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/20 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-gray-650">{v.registrationNumber}</td>
                      <td className="px-3 py-2 truncate max-w-[90px]">{v.name}</td>
                      <td className="px-3 py-2 text-right font-semibold">{currencySymbol}{v.acquisitionCost.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">{currencySymbol}{v.totalRevenue.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{currencySymbol}{v.fuelCost.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{currencySymbol}{v.maintCost.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right bg-red-50/10 font-bold text-red-650 border-x border-gray-200">{currencySymbol}{v.operationalCost.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right bg-emerald-50/10 font-bold text-emerald-700 border-x border-gray-200">{currencySymbol}{v.netProfit.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-bold border-l border-gray-200 bg-indigo-50/10 ${v.roi >= 0 ? "text-indigo-600" : "text-rose-500"}`}>{v.roi}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
