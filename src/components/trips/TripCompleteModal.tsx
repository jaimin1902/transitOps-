"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeTripSchema, CompleteTripInput } from "@/lib/validations/trip";
import { completeTripAction } from "@/actions/trip.actions";
import { X, Loader2, AlertCircle, Compass, Route, Fuel } from "lucide-react";

interface TripCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    startOdometer: number | null;
    plannedDistance: number;
    vehicle: {
      name: string;
      registrationNumber: string;
    };
  } | null;
}

export function TripCompleteModal({ isOpen, onClose, trip }: TripCompleteModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startOdom = trip?.startOdometer || 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(completeTripSchema),
    defaultValues: {
      endOdometer: 0,
      actualDistance: 0,
      fuelConsumed: 0,
    },
  });

  // Pre-fill endOdometer with starting odometer + plannedDistance to help user
  useEffect(() => {
    if (trip) {
      const estimatedEndOdom = startOdom + Number(trip.plannedDistance);
      reset({
        endOdometer: estimatedEndOdom,
        actualDistance: Number(trip.plannedDistance),
        fuelConsumed: Math.round(Number(trip.plannedDistance) * 0.15 * 10) / 10, // Estimate fuel consumption (15L per 100km)
      });
    }
    setError(null);
  }, [trip, startOdom, reset, isOpen]);

  if (!isOpen || !trip) return null;

  const onSubmit = async (data: CompleteTripInput) => {
    setIsSubmitting(true);
    setError(null);

    // Business check
    if (data.endOdometer <= startOdom) {
      setError(`Ending odometer must exceed start odometer (${startOdom} km).`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await completeTripAction(trip.id, data);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to complete trip.");
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

      {/* Dialog container */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Complete Dispatch Trip</h2>
            <p className="text-xs text-slate-500 mt-0.5">Finalize logs and compute ROI metrics</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Quick Details Card */}
            <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Vehicle Assigned:</span>
                <span className="font-semibold text-slate-200">{trip.vehicle.name}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Start Odometer:</span>
                <span className="font-semibold text-slate-200">{startOdom.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Planned Distance:</span>
                <span className="font-semibold text-slate-200">{trip.plannedDistance.toLocaleString()} km</span>
              </div>
            </div>

            {/* Input End Odometer */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Odometer Reading at Completion (km)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Compass className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  step="any"
                  {...register("endOdometer")}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.endOdometer && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.endOdometer.message}
                </span>
              )}
            </div>

            {/* Input Actual Distance */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Actual Distance Traveled (km)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Route className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  step="any"
                  {...register("actualDistance")}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.actualDistance && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.actualDistance.message}
                </span>
              )}
            </div>

            {/* Input Fuel Consumed */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Fuel Consumed (Liters)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Fuel className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  step="any"
                  {...register("fuelConsumed")}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.fuelConsumed && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.fuelConsumed.message}
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm Completion"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
