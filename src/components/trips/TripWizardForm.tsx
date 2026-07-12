"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTripSchema, CreateTripInput } from "@/lib/validations/trip";
import { createTripAction } from "@/actions/trip.actions";
import { X, Loader2, AlertCircle, MapPin, Truck, User, ArrowRight } from "lucide-react";

interface VehicleSummary {
  id: string;
  name: string;
  registrationNumber: string;
  odometer: number;
}

interface DriverSummary {
  id: string;
  name: string;
  licenseCategory: string;
  safetyScore: number;
}

interface TripWizardFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableVehicles: VehicleSummary[];
  availableDrivers: DriverSummary[];
}

export function TripWizardForm({
  isOpen,
  onClose,
  availableVehicles,
  availableDrivers,
}: TripWizardFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeight: 0,
      plannedDistance: 0,
      revenue: 0,
    },
  });

  if (!isOpen) return null;

  const nextStep = async () => {
    // Validate current step fields before going next
    const fields =
      step === 1
        ? (["source", "destination", "cargoWeight", "plannedDistance", "revenue"] as const)
        : (["vehicleId"] as const);

    const isValid = await trigger(fields as unknown as Array<"source" | "destination" | "cargoWeight" | "plannedDistance" | "revenue" | "vehicleId" | "driverId">);
    if (isValid) {
      setStep((prev) => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    setError(null);
  };

  const onSubmit = async (data: CreateTripInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createTripAction(data);
      if (res.success) {
        onClose();
        reset();
        setStep(1);
      } else {
        setError(res.error || "Failed to register trip.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected system error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      ></div>

      {/* Wizard Dialog Container */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Create Operations Dispatch</h2>
            <p className="text-xs text-slate-500 mt-0.5">Wizard Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Indicators */}
        <div className="w-full bg-slate-950 h-1 flex">
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* STEP 1: ROUTE DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4" />
                Route Specifications
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Origin / Source
                  </label>
                  <input
                    type="text"
                    {...register("source")}
                    placeholder="Chicago Hub"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  {errors.source && (
                    <span className="text-xs text-rose-400 mt-1 block font-medium">
                      {errors.source.message}
                    </span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Destination
                  </label>
                  <input
                    type="text"
                    {...register("destination")}
                    placeholder="New York Depot"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  {errors.destination && (
                    <span className="text-xs text-rose-400 mt-1 block font-medium">
                      {errors.destination.message}
                    </span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Cargo Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("cargoWeight")}
                    placeholder="18000"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  {errors.cargoWeight && (
                    <span className="text-xs text-rose-400 mt-1 block font-medium">
                      {errors.cargoWeight.message}
                    </span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Planned Distance (km)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("plannedDistance")}
                    placeholder="1250"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  {errors.plannedDistance && (
                    <span className="text-xs text-rose-400 mt-1 block font-medium">
                      {errors.plannedDistance.message}
                    </span>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Target Revenue ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("revenue")}
                    placeholder="3500"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  {errors.revenue && (
                    <span className="text-xs text-rose-400 mt-1 block font-medium">
                      {errors.revenue.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ASSIGN VEHICLE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4" />
                Assign Asset (Vehicle)
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Select Available Vehicle
                </label>
                <select
                  {...register("vehicleId")}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                >
                  <option value="">-- Choose available asset --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.name} ({v.odometer.toLocaleString()} km)
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <span className="text-xs text-rose-400 mt-1 block font-medium">
                    {errors.vehicleId.message}
                  </span>
                )}

                {availableVehicles.length === 0 && (
                  <div className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No vehicles are currently registered as AVAILABLE.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: ASSIGN OPERATOR */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
                <User className="w-4 h-4" />
                Assign Operator (Driver)
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Select Available Driver
                </label>
                <select
                  {...register("driverId")}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                >
                  <option value="">-- Choose available driver --</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — Class: {d.licenseCategory} (Safety: {d.safetyScore}/100)
                    </option>
                  ))}
                </select>
                {errors.driverId && (
                  <span className="text-xs text-rose-400 mt-1 block font-medium">
                    {errors.driverId.message}
                  </span>
                )}

                {availableDrivers.length === 0 && (
                  <div className="mt-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No drivers are currently registered as AVAILABLE.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || availableVehicles.length === 0 || availableDrivers.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Draft...
                    </>
                  ) : (
                    "Register Draft Trip"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
