import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTripById } from "@/lib/domain/trip.service";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";
import {
  ArrowLeft,
  Route,
  Truck,
  User,
  MapPin,
  Package,
  Gauge,
  Fuel,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  Milestone,
} from "lucide-react";
import { TripStatus } from "@prisma/client";

const STATUS_CONFIG: Record<TripStatus, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  DRAFT: { label: "Draft — Pending Dispatch", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", icon: Clock },
  DISPATCHED: { label: "Dispatched — In Transit", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Truck },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
};

function InfoRow({ icon: Icon, label, value, mono = false }: { icon: React.ElementType; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 mt-0.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{label}</p>
        <p className={`text-sm font-bold text-gray-900 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const trip = await getTripById(params.id);
  if (!trip) notFound();

  const canManage = hasPermission(session.user.role, "MANAGE_TRIPS");
  const sc = STATUS_CONFIG[trip.status];
  const StatusIcon = sc.icon;

  const efficiency =
    trip.actualDistance && trip.fuelConsumed && trip.fuelConsumed > 0
      ? (Number(trip.actualDistance) / Number(trip.fuelConsumed)).toFixed(2)
      : null;

  const distanceDiff =
    trip.actualDistance && trip.plannedDistance
      ? Number(trip.actualDistance) - Number(trip.plannedDistance)
      : null;

  // Timeline steps
  const timeline = [
    { label: "Created", date: trip.createdAt, done: true },
    { label: "Dispatched", date: trip.dispatchedAt, done: !!trip.dispatchedAt },
    { label: "Completed", date: trip.completedAt, done: !!trip.completedAt },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/trips"
          className="h-9 w-9 flex items-center justify-center bg-white border border-gray-200 rounded-button text-gray-500 hover:text-primary-500 hover:border-primary-200 transition-colors shadow-small"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider mb-0.5">
            <Route className="w-3.5 h-3.5" />
            Trip Detail
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {trip.source} → {trip.destination}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {sc.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — route, cargo, telemetry */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route summary banner */}
          <div className={`border rounded-card p-5 flex items-center gap-6 ${sc.bg} ${sc.border}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-small">
                <MapPin className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Origin</p>
                <p className="font-bold text-gray-900">{trip.source}</p>
              </div>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-small">
                <Milestone className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Destination</p>
                <p className="font-bold text-gray-900">{trip.destination}</p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Planned Distance</p>
              <p className="font-black text-gray-900 text-xl">{Number(trip.plannedDistance).toLocaleString()} <span className="text-sm font-medium text-gray-500">km</span></p>
            </div>
          </div>

          {/* Cargo & Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cargo */}
            <div className="bg-white border border-gray-200 rounded-card shadow-small p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cargo Details</h3>
              <InfoRow icon={Package} label="Cargo Weight" value={`${Number(trip.cargoWeight).toLocaleString()} kg`} />
              <InfoRow icon={Truck} label="Vehicle Capacity" value={`${Number(trip.vehicle.maxLoadCapacity).toLocaleString()} kg`} />
              <InfoRow icon={DollarSign} label="Trip Revenue" value={`$${Number(trip.revenue).toLocaleString()}`} />
            </div>

            {/* Odometer / Fuel */}
            <div className="bg-white border border-gray-200 rounded-card shadow-small p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Telemetry</h3>
              <InfoRow icon={Gauge} label="Start Odometer" value={trip.startOdometer != null ? `${Number(trip.startOdometer).toLocaleString()} km` : "—"} />
              <InfoRow icon={Gauge} label="End Odometer" value={trip.endOdometer != null ? `${Number(trip.endOdometer).toLocaleString()} km` : "—"} />
              <InfoRow
                icon={ArrowRightLeft}
                label="Actual vs Planned"
                value={
                  distanceDiff != null
                    ? <span className={distanceDiff > 0 ? "text-amber-600" : "text-emerald-600"}>
                        {Math.abs(distanceDiff)} km {distanceDiff > 0 ? "over" : "under"} plan
                      </span>
                    : "—"
                }
              />
              <InfoRow icon={Fuel} label="Fuel Consumed" value={trip.fuelConsumed != null ? `${Number(trip.fuelConsumed).toLocaleString()} L` : "—"} />
              {efficiency && <InfoRow icon={Fuel} label="Fuel Efficiency" value={`${efficiency} km/L`} />}
            </div>
          </div>

          {/* Fuel logs */}
          {trip.fuelLogs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-card shadow-small overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Fuel Log Entries</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-2.5 text-left">Date</th>
                    <th className="px-5 py-2.5 text-right">Liters</th>
                    <th className="px-5 py-2.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trip.fuelLogs.map((fl) => (
                    <tr key={fl.id} className="hover:bg-gray-50/40">
                      <td className="px-5 py-2.5 text-gray-600 text-xs">
                        {new Date(fl.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-2.5 text-right font-bold text-gray-900">{Number(fl.liters).toLocaleString()} L</td>
                      <td className="px-5 py-2.5 text-right font-bold text-emerald-600">${Number(fl.cost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column — asset, timeline */}
        <div className="space-y-4">
          {/* Vehicle card */}
          <div className="bg-white border border-gray-200 rounded-card shadow-small p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-gray-900">Vehicle</h3>
            </div>
            <InfoRow icon={Truck} label="Registration" value={trip.vehicle.registrationNumber} mono />
            <InfoRow icon={Truck} label="Model" value={trip.vehicle.name} />
            <InfoRow icon={Truck} label="Type" value={trip.vehicle.type} />
            <InfoRow icon={Gauge} label="Current Odometer" value={`${Number(trip.vehicle.odometer).toLocaleString()} km`} />
            <div className="pt-2 mt-2">
              <Link
                href={`/vehicles/${trip.vehicle.id}`}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 hover:underline"
              >
                View Vehicle Profile →
              </Link>
            </div>
          </div>

          {/* Driver card */}
          <div className="bg-white border border-gray-200 rounded-card shadow-small p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-gray-900">Driver</h3>
            </div>
            <InfoRow icon={User} label="Name" value={trip.driver.name} />
            <InfoRow icon={AlertCircle} label="License No." value={trip.driver.licenseNumber} mono />
            <InfoRow icon={AlertCircle} label="Category" value={trip.driver.licenseCategory} />
            <InfoRow
              icon={AlertCircle}
              label="Safety Score"
              value={
                <span className={
                  trip.driver.safetyScore >= 80 ? "text-emerald-600" :
                  trip.driver.safetyScore >= 60 ? "text-amber-600" : "text-red-600"
                }>
                  {trip.driver.safetyScore} / 100
                </span>
              }
            />
            <div className="pt-2 mt-2">
              <Link
                href={`/drivers/${trip.driver.id}`}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 hover:underline"
              >
                View Driver Profile →
              </Link>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-card shadow-small p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Status Timeline</h3>
            <div className="space-y-3">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${step.done ? "bg-primary-500 border-primary-500" : "bg-gray-50 border-gray-200"}`}>
                    {step.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      : <Clock className="w-3.5 h-3.5 text-gray-400" />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${step.done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    {step.date && (
                      <p className="text-[11px] text-gray-500">
                        {new Date(step.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {trip.status === TripStatus.CANCELLED && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full border bg-red-50 border-red-200 flex items-center justify-center shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600">Cancelled</p>
                    {trip.cancelledAt && (
                      <p className="text-[11px] text-gray-500">
                        {new Date(trip.cancelledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Created by */}
          <div className="bg-white border border-gray-200 rounded-card shadow-small p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Created By</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{trip.createdBy.name}</p>
                <p className="text-[10px] text-gray-400">{trip.createdBy.role.replace("_", " ")}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(trip.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
