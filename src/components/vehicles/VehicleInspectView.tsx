"use client";

import React, { useState } from "react";
import { VehicleStatus } from "@prisma/client";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  FileText,
  Wrench,
  Route,
  DollarSign,
  TrendingUp,
  Scale,
  Compass,
  Layers,
  Plus,
} from "lucide-react";
import { DocumentDialogForm } from "./DocumentDialogForm";

interface Trip {
  id: string;
  status: string;
  source: string;
  destination: string;
  dispatchedAt: Date | null;
  completedAt: Date | null;
  revenue: number;
  driver: {
    name: string;
  } | null;
}

interface MaintenanceLog {
  id: string;
  type: string;
  description: string | null;
  cost: number;
  status: string;
  startDate: Date;
  endDate: Date | null;
}

interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: Date;
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: Date;
}

interface VehicleDocument {
  id: string;
  type: string;
  expiryDate: Date | null;
  fileUrl: string;
  uploadedAt: Date;
}

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
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  documents: VehicleDocument[];
}

interface VehicleInspectViewProps {
  vehicle: Vehicle;
}

export function VehicleInspectView({ vehicle }: VehicleInspectViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "trips" | "maintenance" | "finance" | "documents">(
    "overview"
  );
  const [isDocOpen, setIsDocOpen] = useState(false);

  // Financial aggregates for ROI
  const totalRevenue = vehicle.trips.reduce((sum, t) => sum + Number(t.revenue), 0);
  const totalMaintenance = vehicle.maintenanceLogs.reduce((sum, m) => sum + Number(m.cost), 0);
  const totalFuel = vehicle.fuelLogs.reduce((sum, f) => sum + Number(f.cost), 0);
  const totalOtherExpenses = vehicle.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const acquisitionCost = Number(vehicle.acquisitionCost);

  const totalOpsCost = totalMaintenance + totalFuel + totalOtherExpenses;
  const totalCost = acquisitionCost + totalOpsCost;
  const netProfit = totalRevenue - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "trips", label: "Trips History", icon: Route },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "finance", label: "Fuel & Expenses", icon: DollarSign },
    { id: "documents", label: "Documents", icon: FileText },
  ] as const;

  return (
    <div className="space-y-6 text-left">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/vehicles"
          className="p-2 bg-white hover:bg-gray-50 text-gray-500 hover:text-primary-500 rounded-xl border border-gray-300 transition-colors shadow-small"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">Back to Registry</div>
          <h2 className="text-xl font-extrabold text-gray-900">Inspect Vehicle Details</h2>
        </div>
      </div>

      {/* Main Stats Header */}
      <div className="p-6 bg-white border border-gray-200 rounded-card flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-small">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 border border-primary-100 text-primary-500 rounded-2xl flex items-center justify-center shadow-inner">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-black text-gray-900 tracking-tight">
                {vehicle.registrationNumber}
              </span>
              <StatusBadge status={vehicle.status} />
            </div>
            <h3 className="text-base font-bold text-gray-500 mt-0.5">{vehicle.name}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
          <div>
            <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Type</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">{vehicle.type}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Region</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">{vehicle.region || "National"}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Odometer</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5 font-mono">
              {vehicle.odometer.toLocaleString()} km
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Load Limit</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5 font-mono">
              {vehicle.maxLoadCapacity.toLocaleString()} kg
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-white border border-gray-200 p-1.5 rounded-[12px] flex flex-wrap gap-2 shadow-small">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-button transition-all ${
                isActive
                  ? "bg-primary-500 text-white shadow-small"
                  : "text-gray-500 hover:text-primary-500 hover:bg-primary-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div className="min-h-[300px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* ROI Tracker card */}
            <div className="md:col-span-2 p-6 bg-white border border-gray-200 rounded-card space-y-6 shadow-small">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-primary-500 w-5 h-5" />
                  Financial Summary & ROI Tracker
                </h4>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    roi >= 0 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  ROI: {roi.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="text-gray-400 text-[10px] font-bold uppercase mb-1">Total Revenue</div>
                  <div className="text-lg font-extrabold text-emerald-600">${totalRevenue.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="text-gray-400 text-[10px] font-bold uppercase mb-1">Acquisition</div>
                  <div className="text-lg font-extrabold text-gray-800">${acquisitionCost.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="text-gray-400 text-[10px] font-bold uppercase mb-1">Operating Cost</div>
                  <div className="text-lg font-extrabold text-rose-600">${totalOpsCost.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="text-gray-400 text-[10px] font-bold uppercase mb-1">Net Earnings</div>
                  <div className={`text-lg font-extrabold ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {netProfit < 0 && "-"} ${Math.abs(netProfit).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Sub breakdown details */}
              <div className="pt-4 border-t border-gray-200 space-y-3 text-sm">
                <h5 className="font-bold text-gray-700">Operational Cost Breakdown</h5>
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                  <div className="flex justify-between border-r border-gray-200 pr-4">
                    <span>Maintenance Logs:</span>
                    <span className="font-bold text-gray-900">${totalMaintenance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-r border-gray-200 pr-4">
                    <span>Fuel Expenses:</span>
                    <span className="font-bold text-gray-900">${totalFuel.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Expenses:</span>
                    <span className="font-bold text-gray-900">${totalOtherExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick specifications Card */}
            <div className="p-6 bg-white border border-gray-200 rounded-card space-y-4 shadow-small">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Scale className="text-primary-500 w-5 h-5" />
                Asset Registry Info
              </h4>
              <div className="divide-y divide-gray-150 text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Asset Registered:</span>
                  <span className="text-gray-900 font-bold">
                    {new Date(vehicle.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Max Capacity:</span>
                  <span className="text-gray-900 font-bold">{vehicle.maxLoadCapacity.toLocaleString()} kg</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Initial Cost:</span>
                  <span className="text-gray-900 font-bold">${vehicle.acquisitionCost.toLocaleString()}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Working Odometer:</span>
                  <span className="text-gray-900 font-bold">{vehicle.odometer.toLocaleString()} km</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trips history tab */}
        {activeTab === "trips" && (
          <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small animate-in fade-in duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Trip Number</th>
                    <th className="px-6 py-4">Route Details</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {vehicle.trips.length > 0 ? (
                    vehicle.trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50/40 transition-colors h-[52px]">
                        <td className="px-6 py-3.5 font-mono font-bold text-gray-400">
                          {trip.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-gray-900 font-bold">{trip.source}</span>
                          <span className="text-gray-400 mx-2">&rarr;</span>
                          <span className="text-gray-900 font-bold">{trip.destination}</span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-700 font-medium">
                          {trip.driver?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-gray-500 space-y-0.5">
                          {trip.dispatchedAt && (
                            <div>Dispatched: {new Date(trip.dispatchedAt).toLocaleDateString()}</div>
                          )}
                          {trip.completedAt && (
                            <div>Completed: {new Date(trip.completedAt).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-emerald-600">
                          ${Number(trip.revenue).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-primary-50 text-primary-500 border border-primary-100">
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium">
                        No trip records linked to this asset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Maintenance tab */}
        {activeTab === "maintenance" && (
          <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small animate-in fade-in duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Service Type</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Service Date</th>
                    <th className="px-6 py-4">Cost</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {vehicle.maintenanceLogs.length > 0 ? (
                    vehicle.maintenanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/40 transition-colors h-[52px]">
                        <td className="px-6 py-3.5 font-bold text-gray-900">
                          {log.type}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 max-w-sm truncate" title={log.description || undefined}>
                          {log.description}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500">
                          {new Date(log.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-rose-500">
                          ${Number(log.cost).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              log.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">
                        No maintenance logs registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fuel & Expenses tab */}
        {activeTab === "finance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Fuel entries */}
            <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Compass className="text-primary-500 w-4 h-4" />
                  Fuel Records
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase bg-gray-50/20 tracking-wider">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Volume (L)</th>
                      <th className="px-6 py-3">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {vehicle.fuelLogs.length > 0 ? (
                      vehicle.fuelLogs.map((fuel) => (
                        <tr key={fuel.id} className="hover:bg-gray-50/30">
                          <td className="px-6 py-2.5 text-gray-500">
                            {new Date(fuel.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-2.5 text-gray-900 font-semibold">{fuel.liters} L</td>
                          <td className="px-6 py-2.5 font-bold text-rose-500">${Number(fuel.cost).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-6 text-center text-gray-400 font-medium">
                          No fuel entries logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="text-primary-500 w-4 h-4" />
                  Other Operating Expenses
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase bg-gray-50/20 tracking-wider">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Details</th>
                      <th className="px-6 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {vehicle.expenses.length > 0 ? (
                      vehicle.expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/30">
                          <td className="px-6 py-2.5 text-gray-500">
                            {new Date(exp.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-600 uppercase">
                              {exp.type}
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-gray-500 max-w-[150px] truncate" title={exp.description || ""}>
                            {exp.description || "—"}
                          </td>
                          <td className="px-6 py-2.5 font-bold text-rose-500">${Number(exp.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-6 text-center text-gray-400 font-medium">
                          No other operating expenses logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Documents tab */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl shadow-small">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Compliance Documents</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Insurance policies, emissions checks, and interstate permits</p>
              </div>
              <button
                onClick={() => setIsDocOpen(true)}
                className="h-9 px-3 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-button flex items-center gap-1 transition-colors shadow-small"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Document
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-small animate-in fade-in duration-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Document Type</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4">Uploaded At</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {vehicle.documents.length > 0 ? (
                      vehicle.documents.map((doc) => {
                        const isExpired = doc.expiryDate ? new Date(doc.expiryDate) < new Date() : false;
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50/40 transition-colors h-[52px]">
                            <td className="px-6 py-3.5 font-bold text-gray-900">
                              {doc.type}
                            </td>
                            <td className="px-6 py-3.5 text-gray-700">
                              {doc.expiryDate ? (
                                <span className={isExpired ? "text-rose-600 font-bold" : "font-medium"}>
                                  {new Date(doc.expiryDate).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-bold transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View PDF / File
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">
                          No compliance documents uploaded for this vehicle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <DocumentDialogForm
        isOpen={isDocOpen}
        onClose={() => {
          setIsDocOpen(false);
          router.refresh();
        }}
        vehicleId={vehicle.id}
      />
    </div>
  );
}
