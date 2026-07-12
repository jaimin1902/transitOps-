"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dispatchTripSchema, DispatchTripInput } from "@/lib/validations/trip";
import { dispatchTripAction } from "@/actions/trip.actions";
import { X, Loader2, AlertCircle, Compass } from "lucide-react";

interface TripDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    vehicle: {
      registrationNumber: string;
      name: string;
      odometer: number;
    };
  } | null;
}

export function TripDispatchModal({ isOpen, onClose, trip }: TripDispatchModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(dispatchTripSchema),
    defaultValues: {
      startOdometer: 0,
    },
  });

  // Populate startOdometer with vehicle's current odometer when trip updates
  useEffect(() => {
    if (trip) {
      reset({
        startOdometer: Number(trip.vehicle.odometer),
      });
    }
    setError(null);
  }, [trip, reset, isOpen]);

  if (!isOpen || !trip) return null;

  const onSubmit = async (data: DispatchTripInput) => {
    setIsSubmitting(true);
    setError(null);

    // Business check before sending
    if (data.startOdometer < trip.vehicle.odometer) {
      setError(`Start odometer cannot be less than the vehicle's current odometer (${trip.vehicle.odometer} km).`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await dispatchTripAction(trip.id, data);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to dispatch trip.");
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
            <h2 className="text-lg font-bold text-white">Dispatch Asset Trip</h2>
            <p className="text-xs text-slate-500 mt-0.5">Start operations transition</p>
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
                <span>Plate Number:</span>
                <span className="font-mono font-semibold text-indigo-400">{trip.vehicle.registrationNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Current Odometer:</span>
                <span className="font-semibold text-slate-200">{trip.vehicle.odometer.toLocaleString()} km</span>
              </div>
            </div>

            {/* Input Start Odometer */}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Odometer Reading at Dispatch (km)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Compass className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  step="any"
                  {...register("startOdometer")}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
              {errors.startOdometer && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.startOdometer.message}
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/10 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dispatching...
                </>
              ) : (
                "Confirm Dispatch"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
