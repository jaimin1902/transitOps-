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
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      ></div>

      {/* Dialog container */}
      <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Modify vehicle details" : "Register new vehicle"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
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

          <div className="grid grid-cols-2 gap-4">
            {/* Registration Number */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("registrationNumber")}
                placeholder="MH-12-PQ-1234"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.registrationNumber && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.registrationNumber.message}
                </span>
              )}
            </div>

            {/* Vehicle Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Name / Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Volvo FH16 Truck"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.name && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("type")}
                placeholder="Heavy Truck"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.type && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.type.message}
                </span>
              )}
            </div>

            {/* Region */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Region
              </label>
              <input
                type="text"
                {...register("region")}
                placeholder="North"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.region && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.region.message}
                </span>
              )}
            </div>

            {/* Max Load Capacity */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Max Load Capacity (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                {...register("maxLoadCapacity")}
                placeholder="25000"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.maxLoadCapacity && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.maxLoadCapacity.message}
                </span>
              )}
            </div>

            {/* Odometer */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Odometer Reading (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                {...register("odometer")}
                placeholder="12500"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.odometer && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.odometer.message}
                </span>
              )}
            </div>

            {/* Acquisition Cost */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Acquisition Cost ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                {...register("acquisitionCost")}
                placeholder="150000"
                disabled={isSubmitting}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
              />
              {errors.acquisitionCost && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.acquisitionCost.message}
                </span>
              )}
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Current Status
              </label>
              <select
                {...register("status")}
                disabled={isSubmitting || vehicle?.status === VehicleStatus.ON_TRIP}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50 select-arrow cursor-pointer"
              >
                <option value={VehicleStatus.AVAILABLE}>Available</option>
                <option value={VehicleStatus.IN_SHOP}>In Shop</option>
                <option value={VehicleStatus.RETIRED}>Retired</option>
                {vehicle?.status === VehicleStatus.ON_TRIP && (
                  <option value={VehicleStatus.ON_TRIP}>On Trip</option>
                )}
              </select>
              {errors.status && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.status.message}
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-button text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-small"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save details"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
