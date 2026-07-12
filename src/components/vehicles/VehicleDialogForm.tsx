"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema, VehicleInput } from "@/lib/validations/vehicle";
import { VehicleStatus } from "@prisma/client";
import { createVehicleAction, updateVehicleAction } from "@/actions/vehicle.actions";
import { X, Loader2, AlertCircle } from "lucide-react";

interface VehicleDialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: {
    id: string;
    registrationNumber: string;
    name: string;
    type: string;
    maxLoadCapacity: number;
    odometer: number;
    acquisitionCost: number;
    status: VehicleStatus;
    region: string | null;
  } | null;
}

export function VehicleDialogForm({ isOpen, onClose, vehicle }: VehicleDialogFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!vehicle;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: "",
      name: "",
      type: "",
      maxLoadCapacity: 0,
      odometer: 0,
      acquisitionCost: 0,
      status: VehicleStatus.AVAILABLE,
      region: "",
    },
  });

  // Populate form defaults when in edit mode
  useEffect(() => {
    if (vehicle) {
      reset({
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        type: vehicle.type,
        maxLoadCapacity: vehicle.maxLoadCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
        region: vehicle.region || "",
      });
    } else {
      reset({
        registrationNumber: "",
        name: "",
        type: "",
        maxLoadCapacity: 0,
        odometer: 0,
        acquisitionCost: 0,
        status: VehicleStatus.AVAILABLE,
        region: "",
      });
    }
    setError(null);
  }, [vehicle, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: VehicleInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let res;
      if (isEditMode && vehicle) {
        res = await updateVehicleAction(vehicle.id, data);
      } else {
        res = await createVehicleAction(data);
      }

      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to save vehicle details.");
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
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {isEditMode ? "Modify Vehicle Details" : "Register New Vehicle"}
          </h2>
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

          <div className="grid grid-cols-2 gap-4">
            {/* Registration Number */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Registration Number
              </label>
              <input
                type="text"
                {...register("registrationNumber")}
                placeholder="MH-12-PQ-1234"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.registrationNumber && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.registrationNumber.message}
                </span>
              )}
            </div>

            {/* Vehicle Name */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Name / Model
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Volvo FH16 Truck"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.name && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Type
              </label>
              <input
                type="text"
                {...register("type")}
                placeholder="Heavy Truck"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.type && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.type.message}
                </span>
              )}
            </div>

            {/* Region */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Region
              </label>
              <input
                type="text"
                {...register("region")}
                placeholder="North"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.region && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.region.message}
                </span>
              )}
            </div>

            {/* Max Load Capacity */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Max Load Capacity (kg)
              </label>
              <input
                type="number"
                step="any"
                {...register("maxLoadCapacity")}
                placeholder="25000"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.maxLoadCapacity && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.maxLoadCapacity.message}
                </span>
              )}
            </div>

            {/* Odometer */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Odometer Reading (km)
              </label>
              <input
                type="number"
                step="any"
                {...register("odometer")}
                placeholder="12500"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.odometer && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.odometer.message}
                </span>
              )}
            </div>

            {/* Acquisition Cost */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Acquisition Cost ($)
              </label>
              <input
                type="number"
                step="any"
                {...register("acquisitionCost")}
                placeholder="150000"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.acquisitionCost && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.acquisitionCost.message}
                </span>
              )}
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Current Status
              </label>
              <select
                {...register("status")}
                disabled={isSubmitting || vehicle?.status === VehicleStatus.ON_TRIP}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50 appearance-none"
              >
                <option value={VehicleStatus.AVAILABLE} className="bg-slate-950">Available</option>
                <option value={VehicleStatus.IN_SHOP} className="bg-slate-950">In Shop</option>
                <option value={VehicleStatus.RETIRED} className="bg-slate-950">Retired</option>
                {vehicle?.status === VehicleStatus.ON_TRIP && (
                  <option value={VehicleStatus.ON_TRIP} className="bg-slate-950">On Trip</option>
                )}
              </select>
              {errors.status && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.status.message}
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
                  Saving...
                </>
              ) : (
                "Save Details"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
