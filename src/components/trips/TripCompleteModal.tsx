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

  useEffect(() => {
    if (trip) {
      const estimatedEndOdom = startOdom + Number(trip.plannedDistance);
      reset({
        endOdometer: estimatedEndOdom,
        actualDistance: Number(trip.plannedDistance),
        fuelConsumed: Math.round(Number(trip.plannedDistance) * 0.15 * 10) / 10,
      });
    }
    setError(null);
  }, [trip, startOdom, reset, isOpen]);

  if (!isOpen || !trip) return null;

  const onSubmit = async (data: CompleteTripInput) => {
    setIsSubmitting(true);
    setError(null);

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
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={() => { if (!isSubmitting) onClose(); }}
      ></div>

      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Complete Dispatch Trip</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Finalize logs and compute ROI metrics</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-left">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-input">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Quick Details Card */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Vehicle Assigned:</span>
                <span className="font-semibold text-gray-900">{trip.vehicle.name}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Start Odometer:</span>
                <span className="font-semibold text-gray-900">{startOdom.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Planned Distance:</span>
                <span className="font-semibold text-gray-900">{trip.plannedDistance.toLocaleString()} km</span>
              </div>
            </div>

            {/* Input End Odometer */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Odometer at Completion (km) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Compass className="w-4 h-4" />
                </span>
                <input type="number" step="any" {...register("endOdometer")} disabled={isSubmitting}
                  className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50" />
              </div>
              {errors.endOdometer && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.endOdometer.message}</span>}
            </div>

            {/* Input Actual Distance */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Actual Distance Traveled (km) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Route className="w-4 h-4" />
                </span>
                <input type="number" step="any" {...register("actualDistance")} disabled={isSubmitting}
                  className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50" />
              </div>
              {errors.actualDistance && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.actualDistance.message}</span>}
            </div>

            {/* Input Fuel Consumed */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Fuel Consumed (Liters)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Fuel className="w-4 h-4" />
                </span>
                <input type="number" step="any" {...register("fuelConsumed")} disabled={isSubmitting}
                  className="w-full h-[42px] pl-10 pr-4 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50" />
              </div>
              {errors.fuelConsumed && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.fuelConsumed.message}</span>}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="h-10 px-5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-button text-sm font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-small">
              {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Completing...</>) : ("Confirm Complete")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
