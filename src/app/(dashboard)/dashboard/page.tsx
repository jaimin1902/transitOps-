import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/domain/dashboard.service";
import { CustomSVGChart } from "@/components/dashboard/CustomSVGChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentDispatches } from "@/components/dashboard/RecentDispatches";
import {
  Sparkles,
  TrendingUp,
  Truck,
  DollarSign,
  Compass,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { kpis, recentTrips, recentAudits, chartData } = await getDashboardStats();

  return (
    <div className="space-y-6 text-left">
      {/* Welcome Banner */}
      <div className="relative p-6 rounded-card bg-white border border-gray-200 overflow-hidden shadow-small group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 border border-primary-100 text-primary-500 text-xs font-semibold rounded-full">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Welcome back
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Hello, {session.user.name}
            </h1>
            <p className="text-gray-500 text-sm font-medium max-w-xl">
              You are signed in as a <span className="text-primary-500 font-semibold uppercase">{session.user.role.replace("_", " ")}</span>. Monitor fleet operations, dispatches, audits, and logistics ROI stats.
            </p>
          </div>

          <div className="flex gap-4 shrink-0">
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center shadow-small">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Status</span>
              <span className="text-xs font-bold text-emerald-600 uppercase block mt-1">Active</span>
            </div>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center shadow-small">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Trips running</span>
              <span className="text-xs font-bold text-primary-500 block mt-1">{kpis.activeTrips} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Section KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 shrink-0 border border-primary-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total revenue</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">
              ${kpis.totalRevenue.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Overall logged dispatches</p>
          </div>
        </div>

        {/* Card 2: Cargo Weight */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cargo transported</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">
              {kpis.cargoWeight.toLocaleString()} kg
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Total capacity managed</p>
          </div>
        </div>

        {/* Card 3: Eligible Assets */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 border border-purple-100">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available vehicles</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">
              {kpis.availableVehicles} / {kpis.vehicleCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Vehicles ready to allocate</p>
          </div>
        </div>

        {/* Card 4: Estimated Profit */}
        <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Net profit</p>
            <p className="text-xl font-extrabold text-gray-900 mt-1">
              ${kpis.netProfit.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Revenue minus total expenses</p>
          </div>
        </div>
      </div>

      {/* Middle Section Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom SVG Bar Chart */}
        <div className="lg:col-span-2">
          <CustomSVGChart data={chartData} />
        </div>

        {/* Operational Timeline Audits */}
        <div className="lg:col-span-1">
          <RecentActivity logs={recentAudits} />
        </div>
      </div>

      {/* Bottom Section Dispatches List */}
      <div className="w-full">
        <RecentDispatches trips={recentTrips} />
      </div>
    </div>
  );
}
