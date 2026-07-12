import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDriverDetail } from "@/lib/domain/driver.service";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  BadgeCheck,
  XCircle,
  Car,
  MapPin,
  Calendar,
  Shield,
  Phone,
  CreditCard,
  Clock,
  CheckCircle2,
  XOctagon,
} from "lucide-react";
import { TripStatus, DriverStatus } from "@prisma/client";

export default async function DriverDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const driver = await getDriverDetail(params.id);
  if (!driver) notFound();

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = driver.licenseExpiryDate < now;
  const isExpiringSoon = !isExpired && driver.licenseExpiryDate <= thirtyDays;

  // Trip stats
  const totalTrips = driver.trips.length;
  const completedTrips = driver.trips.filter((t) => t.status === TripStatus.COMPLETED).length;
  const cancelledTrips = driver.trips.filter((t) => t.status === TripStatus.CANCELLED).length;
  const totalDistance = driver.trips
    .filter((t) => t.actualDistance)
    .reduce((sum, t) => sum + Number(t.actualDistance), 0);
  const totalRevenue = driver.trips.reduce((sum, t) => sum + Number(t.revenue), 0);

  // Status badge config
  const statusConfig: Record<DriverStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    AVAILABLE: { label: "Available", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
    ON_TRIP: { label: "On Trip", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: Car },
    OFF_DUTY: { label: "Off Duty", bg: "bg-gray-100 border-gray-300", text: "text-gray-600", icon: Clock },
    SUSPENDED: { label: "Suspended", bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XOctagon },
  };
  const sc = statusConfig[driver.status];
  const StatusIcon = sc.icon;

  const safetyColor =
    driver.safetyScore >= 80
      ? "text-emerald-600"
      : driver.safetyScore >= 60
      ? "text-amber-600"
      : "text-red-600";

  const tripStatusStyles: Record<TripStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
    DISPATCHED: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Back nav + header */}
      <div className="flex items-center gap-4">
        <Link
          href="/drivers"
          className="h-9 w-9 flex items-center justify-center bg-white border border-gray-200 rounded-button text-gray-500 hover:text-primary-500 hover:border-primary-200 transition-colors shadow-small"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider mb-0.5">
            <User className="w-3.5 h-3.5" />
            Driver Profile
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{driver.name}</h1>
        </div>
      </div>

      {/* Top cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Identity card */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-card shadow-small p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{driver.name}</h2>
                {driver.user && (
                  <p className="text-xs text-gray-500 mt-0.5">{driver.user.email}</p>
                )}
                <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 text-xs font-semibold rounded-full border ${sc.bg} ${sc.text}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {sc.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">License Number</p>
                <p className="font-mono font-bold text-gray-900 text-sm">{driver.licenseNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <BadgeCheck className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Category</p>
                <p className="font-bold text-gray-900 text-sm">{driver.licenseCategory}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Contact</p>
                <p className="font-bold text-gray-900 text-sm">{driver.contactNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center border ${isExpired ? "bg-red-50 border-red-200" : isExpiringSoon ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                <Calendar className={`w-3.5 h-3.5 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">License Expiry</p>
                <p className={`font-bold text-sm ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}>
                  {driver.licenseExpiryDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  {isExpired && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">EXPIRED</span>}
                  {isExpiringSoon && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">SOON</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety score card */}
        <div className="bg-white border border-gray-200 rounded-card shadow-small p-6 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Safety Score</p>
          <div className={`text-6xl font-black ${safetyColor}`}>{driver.safetyScore}</div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${driver.safetyScore >= 80 ? "bg-emerald-500" : driver.safetyScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${driver.safetyScore}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-medium">
            {driver.safetyScore >= 80 ? "Excellent standing" : driver.safetyScore >= 60 ? "Needs monitoring" : "Critical — review required"}
          </p>
        </div>
      </div>

      {/* KPI stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Trips", value: totalTrips, icon: Car, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { label: "Completed", value: completedTrips, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Cancelled", value: cancelledTrips, icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-100" },
          { label: "Total Distance", value: `${totalDistance.toLocaleString()} km`, icon: MapPin, color: "text-primary-500", bg: "bg-primary-50 border-primary-100" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-card shadow-small p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{kpi.label}</p>
              <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trip History table */}
      <div className="bg-white border border-gray-200 rounded-card shadow-small overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-sm">Trip History</h3>
          <p className="text-xs text-gray-500 mt-0.5">All dispatch records assigned to this driver</p>
        </div>
        {driver.trips.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm font-medium">No trips found for this driver.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/40 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Route</th>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Distance</th>
                  <th className="px-6 py-3">Revenue</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {driver.trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        {trip.source}
                        <span className="text-gray-400">→</span>
                        {trip.destination}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {trip.vehicle.registrationNumber}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {trip.actualDistance
                        ? `${Number(trip.actualDistance).toLocaleString()} km`
                        : `~${Number(trip.plannedDistance).toLocaleString()} km`}
                    </td>
                    <td className="px-6 py-3 font-bold text-emerald-600">
                      ${Number(trip.revenue).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${tripStatusStyles[trip.status]}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalRevenue > 0 && (
          <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">{totalTrips} total trips • {totalDistance.toLocaleString()} km driven</span>
            <span className="font-bold text-emerald-600">Total Revenue: ${totalRevenue.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
