"use client";

import React, { useState, useMemo } from "react";
import { TripStatus } from "@prisma/client";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTripSchema, CreateTripInput } from "@/lib/validations/trip";
import { createTripAction, cancelTripAction } from "@/actions/trip.actions";
import { TripTable } from "./TripTable";
import { StatusBadge } from "./StatusBadge";
import { TripDispatchModal } from "./TripDispatchModal";
import { TripCompleteModal } from "./TripCompleteModal";
import {
  Route,
  Truck,
  User,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Eye,
  ListFilter,
  Layers,
  MapPin,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface VehicleSummary {
  id: string;
  name: string;
  registrationNumber: string;
  maxLoadCapacity?: number;
}

interface DriverSummary {
  id: string;
  name: string;
  licenseCategory?: string;
  safetyScore?: number;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelConsumed: number | null;
  revenue: number;
  status: TripStatus;
  createdById: string;
  createdAt: Date;
  dispatchedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  vehicle: {
    registrationNumber: string;
    name: string;
    odometer: number;
  };
  driver: {
    name: string;
    safetyScore: number;
  };
}

interface TripWorkspaceProps {
  initialTrips: Trip[];
  availableVehicles: VehicleSummary[];
  availableDrivers: DriverSummary[];
  userRole?: string;
  userDriverId?: string | null;
}

export function TripWorkspace({
  initialTrips,
  availableVehicles,
  availableDrivers,
  userRole,
  userDriverId,
}: TripWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"live" | "registry">("live");
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Modals for actions
  const [dispatchTrip, setDispatchTrip] = useState<Trip | null>(null);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);

  // React Hook Form for Inline Trip Creation
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema) as unknown as Resolver<CreateTripInput>,
    defaultValues: {
      source: "",
      destination: "",
      plannedDistance: 0,
      cargoWeight: 0,
      revenue: 0,
      vehicleId: "",
      driverId: "",
    },
  });

  const cargoWeightVal = watch("cargoWeight");
  const selectedVehicleId = watch("vehicleId");

  const selectedVehicle = availableVehicles.find((v) => v.id === selectedVehicleId);
  const isOverCapacity = !!(
    selectedVehicle &&
    selectedVehicle.maxLoadCapacity &&
    Number(cargoWeightVal) > selectedVehicle.maxLoadCapacity
  );
  const overage =
    selectedVehicle && selectedVehicle.maxLoadCapacity
      ? Number(cargoWeightVal) - selectedVehicle.maxLoadCapacity
      : 0;

  // Filter stats for stepper
  const stats = useMemo(() => {
    return {
      draft: trips.filter((t) => t.status === "DRAFT").length,
      dispatched: trips.filter((t) => t.status === "DISPATCHED").length,
      completed: trips.filter((t) => t.status === "COMPLETED").length,
      cancelled: trips.filter((t) => t.status === "CANCELLED").length,
    };
  }, [trips]);

  const canManage = userRole === "ADMIN" || userRole === "FLEET_MANAGER" || userRole === "DISPATCHER";

  const handleCreateTrip = async (data: CreateTripInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await createTripAction(data);
      if (res.success && res.data) {
        setSuccess(true);
        // Refresh local state list
        const newTrip: Trip = {
          ...(res.data as any),
          vehicle: availableVehicles.find((v) => v.id === data.vehicleId) as any,
          driver: availableDrivers.find((d) => d.id === data.driverId) as any,
        };
        setTrips((prev) => [newTrip, ...prev]);
        reset();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || "Failed to register dispatch draft.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTrip = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this trip?")) return;

    try {
      const res = await cancelTripAction(id);
      if (res.success && res.data) {
        setTrips((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: TripStatus.CANCELLED, cancelledAt: new Date() } : t))
        );
      } else {
        alert(res.error || "Failed to cancel trip.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel trip.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector tab controls */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode("live")}
            className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              viewMode === "live"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Live Dispatch Board
          </button>
          <button
            onClick={() => setViewMode("registry")}
            className={`pb-2.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              viewMode === "registry"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Detailed Registry Table
          </button>
        </div>
      </div>

      {viewMode === "registry" ? (
        <TripTable
          initialTrips={trips}
          availableVehicles={availableVehicles.map((v) => ({ ...v, odometer: 0 }))}
          availableDrivers={availableDrivers.map((d) => ({ ...d, safetyScore: d.safetyScore || 100 }))}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: Stepper + Create Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Trip Lifecycle Stepper */}
            <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Trip Lifecycle Pipeline
              </h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700">
                    {stats.draft}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Drafts</span>
                </div>
                <div className="h-0.5 bg-gray-200 flex-1 -mt-4"></div>
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-xs text-blue-600">
                    {stats.dispatched}
                  </div>
                  <span className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Active</span>
                </div>
                <div className="h-0.5 bg-gray-200 flex-1 -mt-4"></div>
                <div className="flex flex-col items-center flex-1 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600">
                    {stats.completed}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 mt-1 uppercase">Done</span>
                </div>
              </div>
            </div>

            {/* Quick Create Form */}
            {canManage ? (
              <div className="bg-white border border-gray-200 rounded-card p-5 shadow-small space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Register New Dispatch
                  </h3>
                  <p className="text-[11px] text-gray-400">Saves initially as a DRAFT status dispatch</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-input font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs rounded-input font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-650 shrink-0" />
                    Trip registered successfully as DRAFT.
                  </div>
                )}

                <form onSubmit={handleSubmit(handleCreateTrip)} className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Origin / Source
                      </label>
                      <input
                        type="text"
                        required
                        {...register("source")}
                        className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                        placeholder="Chicago Depot"
                      />
                      {errors.source && <span className="text-[10px] text-red-650">{errors.source.message}</span>}
                    </div>

                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Destination
                      </label>
                      <input
                        type="text"
                        required
                        {...register("destination")}
                        className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                        placeholder="Detroit Hub"
                      />
                      {errors.destination && <span className="text-[10px] text-red-650">{errors.destination.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Distance (km)
                      </label>
                      <input
                        type="number"
                        required
                        {...register("plannedDistance")}
                        className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                        placeholder="450"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Payload (kg)
                      </label>
                      <input
                        type="number"
                        required
                        {...register("cargoWeight")}
                        className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                        placeholder="8000"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Revenue ($)
                      </label>
                      <input
                        type="number"
                        required
                        {...register("revenue")}
                        className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500"
                        placeholder="1200"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Assign Vehicle
                      </label>
                      <select
                        required
                        {...register("vehicleId")}
                        className="w-full h-9 px-2 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500 select-arrow"
                      >
                        <option value="">-- Choose available vehicle --</option>
                        {availableVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.registrationNumber} — {v.name} ({v.maxLoadCapacity || 0} kg capacity)
                          </option>
                        ))}
                      </select>
                      {isOverCapacity && (
                        <span className="text-[10px] text-red-650 font-bold block animate-pulse">
                          Capacity exceeded by {overage} kg — dispatch blocked
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Assign Operator
                      </label>
                      <select
                        required
                        {...register("driverId")}
                        className="w-full h-9 px-2 bg-white border border-gray-300 text-gray-900 text-xs rounded-input focus:outline-none focus:border-primary-500 select-arrow"
                      >
                        <option value="">-- Choose eligible operator --</option>
                        {availableDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} (License: {d.licenseCategory} · Score: {d.safetyScore}/100)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isOverCapacity}
                    className="w-full h-10 bg-primary-600 hover:bg-primary-750 text-white text-xs font-bold rounded-button transition-colors flex items-center justify-center gap-1.5 shadow-small disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Register Dispatch
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 text-gray-500 text-xs rounded-card">
                Only managers and dispatchers can register new dispatches.
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Live Running Trips Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Live Dispatches Board
              </h3>
              <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-extrabold">
                {trips.length} Total Trips
              </span>
            </div>

            {trips.length === 0 ? (
              <div className="p-8 text-center bg-white border border-gray-200 rounded-card text-gray-400 text-xs font-medium">
                No active or registered dispatches in system database.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trips.map((trip) => {
                  const isDraft = trip.status === "DRAFT";
                  const isDispatched = trip.status === "DISPATCHED";

                  const isAssignedDriver = userDriverId === trip.driverId;
                  const isManager = userRole === "ADMIN" || userRole === "FLEET_MANAGER";

                  const canDispatch = isDraft && (isManager || isAssignedDriver);
                  const canComplete = isDispatched && (isManager || isAssignedDriver);
                  const canCancel = isDraft && isManager;

                  return (
                    <div
                      key={trip.id}
                      className="bg-white border border-gray-200 hover:border-primary-200 rounded-card p-4 shadow-small flex flex-col justify-between space-y-4 transition-all"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] text-gray-400 font-bold uppercase">
                            #{trip.id.substring(0, 8).toUpperCase()}
                          </span>
                          <div className="font-bold text-gray-800 text-sm flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {trip.source} &rarr; {trip.destination}
                          </div>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      {/* Middle Operator details */}
                      <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-100 py-2.5 my-1 bg-gray-50/30 px-2 rounded">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Vehicle Plate</span>
                          <span className="font-mono font-bold text-indigo-600 text-[10px]">
                            {trip.vehicle.registrationNumber}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Operator / Driver</span>
                          <span className="font-semibold text-gray-700 truncate">{trip.driver.name}</span>
                        </div>
                      </div>

                      {/* Distance + Revenue Metrics */}
                      <div className="flex justify-between items-center text-[11px] font-medium text-gray-500">
                        <div>Dist: {trip.plannedDistance} km</div>
                        <div className="font-extrabold text-emerald-600">Est. Revenue: ${trip.revenue}</div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <Link
                          href={`/trips/${trip.id}`}
                          className="h-8 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-button font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {canDispatch && (
                            <button
                              onClick={() => setDispatchTrip(trip)}
                              className="h-8 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-xs font-bold transition-colors flex items-center gap-1 shadow-small"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              Dispatch
                            </button>
                          )}
                          {canComplete && (
                            <button
                              onClick={() => setCompleteTrip(trip)}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button text-xs font-bold transition-colors flex items-center gap-1 shadow-small"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Complete
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => handleCancelTrip(trip.id)}
                              className="p-1.5 bg-white border border-gray-300 hover:border-red-300 text-gray-400 hover:text-red-500 rounded-lg transition-colors shadow-small"
                              title="Cancel trip"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatches actions modals */}
      {dispatchTrip && (
        <TripDispatchModal
          isOpen={!!dispatchTrip}
          onClose={() => {
            setDispatchTrip(null);
            window.location.reload();
          }}
          trip={{
            id: dispatchTrip.id,
            vehicle: {
              registrationNumber: dispatchTrip.vehicle.registrationNumber,
              name: dispatchTrip.vehicle.name,
              odometer: dispatchTrip.vehicle.odometer ?? 0,
            },
          }}
        />
      )}

      {completeTrip && (
        <TripCompleteModal
          isOpen={!!completeTrip}
          onClose={() => {
            setCompleteTrip(null);
            window.location.reload();
          }}
          trip={{
            id: completeTrip.id,
            startOdometer: completeTrip.startOdometer,
            plannedDistance: completeTrip.plannedDistance,
            vehicle: {
              registrationNumber: completeTrip.vehicle.registrationNumber,
              name: completeTrip.vehicle.name,
            },
          }}
        />
      )}
    </div>
  );
}
