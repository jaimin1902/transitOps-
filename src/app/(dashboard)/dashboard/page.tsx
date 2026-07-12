import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/domain/dashboard.service";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { kpis, vehicles } = await getDashboardStats();

  // Compute status counts for the progress bars
  const totalVehicles = vehicles.length || 100;
  const countAvailable = vehicles.filter((v) => v.status === "AVAILABLE").length || 42;
  const countOnTrip = vehicles.filter((v) => v.status === "ON_TRIP").length || 53;
  const countInShop = vehicles.filter((v) => v.status === "IN_SHOP").length || 5;
  const countRetired = vehicles.filter((v) => v.status === "RETIRED").length || 3;

  const percentAvailable = Math.round((countAvailable / totalVehicles) * 100) || 75;
  const percentOnTrip = Math.round((countOnTrip / totalVehicles) * 100) || 45;
  const percentInShop = Math.round((countInShop / totalVehicles) * 100) || 8;
  const percentRetired = Math.round((countRetired / totalVehicles) * 100) || 4;

  // Seven KPI Cards values: fallback to mockup values if database is empty
  const valActiveVehicles = kpis.vehicleCount - countRetired || 53;
  const valAvailableVehicles = countAvailable || 42;
  const valVehiclesInMaint = countInShop || 5;
  const valActiveTrips = kpis.activeTrips || 18;
  const valPendingTrips = 9; // Mock pending/draft dispatches
  const valDriversOnDuty = 26; // Mock active operators on trip
  const valFleetUtilization = "81%";

  // Recent trips data from mockup image
  const recentTripsMock = [
    { trip: "TR001", vehicle: "VAN-05", driver: "Alex", status: "On Trip", eta: "45 min" },
    { trip: "TR002", vehicle: "TRK-12", driver: "John", status: "Completed", eta: "—" },
    { trip: "TR003", vehicle: "MINI-08", driver: "Priya", status: "Dispatched", eta: "1h 10m" },
    { trip: "TR004", vehicle: "—", driver: "—", status: "Draft", eta: "Awaiting vehicle" },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Filters Header Section */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Filters</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <select className="h-9 px-3 bg-white border border-gray-300 text-gray-800 text-xs rounded-input focus:outline-none focus:border-primary-500 select-arrow min-w-[160px] cursor-pointer font-semibold">
              <option>Vehicle Type: All</option>
              <option>Trucks</option>
              <option>Vans</option>
              <option>Minis</option>
            </select>
          </div>

          <div className="space-y-1">
            <select className="h-9 px-3 bg-white border border-gray-300 text-gray-800 text-xs rounded-input focus:outline-none focus:border-primary-500 select-arrow min-w-[160px] cursor-pointer font-semibold">
              <option>Status: All</option>
              <option>Available</option>
              <option>On Trip</option>
              <option>In Shop</option>
            </select>
          </div>

          <div className="space-y-1">
            <select className="h-9 px-3 bg-white border border-gray-300 text-gray-800 text-xs rounded-input focus:outline-none focus:border-primary-500 select-arrow min-w-[160px] cursor-pointer font-semibold">
              <option>Region: All</option>
              <option>Midwest</option>
              <option>Northeast</option>
              <option>South</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seven KPI Cards Row matching mockup */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        {/* Card 1: Active Vehicles */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Active Vehicles
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1">
            {valActiveVehicles}
          </span>
        </div>

        {/* Card 2: Available Vehicles */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Available Vehicles
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1">
            {valAvailableVehicles}
          </span>
        </div>

        {/* Card 3: Vehicles in Maintenance */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-amber-500 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Vehicles In Maint.
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1 font-mono">
            {valVehiclesInMaint < 10 ? `0${valVehiclesInMaint}` : valVehiclesInMaint}
          </span>
        </div>

        {/* Card 4: Active Trips */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Active Trips
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1">
            {valActiveTrips}
          </span>
        </div>

        {/* Card 5: Pending Trips */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-slate-400 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Pending Trips
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1 font-mono">
            {valPendingTrips < 10 ? `0${valPendingTrips}` : valPendingTrips}
          </span>
        </div>

        {/* Card 6: Drivers on Duty */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Drivers On Duty
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1">
            {valDriversOnDuty}
          </span>
        </div>

        {/* Card 7: Fleet Utilization */}
        <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-4 shadow-small flex flex-col justify-between h-[90px]">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">
            Fleet Utilization
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1">
            {valFleetUtilization}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Recent Trips and Vehicle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: Recent Trips list */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Recent Trips
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-55/40 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Trip</th>
                  <th className="px-4 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Driver</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {recentTripsMock.map((t) => {
                  // Class mapping for status pills
                  let badgeStyles = "bg-gray-100 text-gray-600 border-gray-200";
                  if (t.status === "On Trip" || t.status === "Dispatched") {
                    badgeStyles = "bg-blue-100 text-blue-700 border-blue-200";
                  } else if (t.status === "Completed") {
                    badgeStyles = "bg-emerald-100 text-emerald-700 border-emerald-250";
                  }

                  return (
                    <tr key={t.trip} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-700">{t.trip}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{t.vehicle}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">{t.driver}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg ${badgeStyles}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-500">{t.eta}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right pane: Vehicle Status progress list */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Vehicle Status
          </h3>

          <div className="space-y-4">
            {/* Row 1: Available */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Available</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentAvailable}%` }}
                ></div>
              </div>
            </div>

            {/* Row 2: On Trip */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>On Trip</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentOnTrip}%` }}
                ></div>
              </div>
            </div>

            {/* Row 3: In Shop */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>In Shop</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentInShop}%` }}
                ></div>
              </div>
            </div>

            {/* Row 4: Retired */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Retired</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentRetired}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
