"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTripSchema, CreateTripInput } from "@/lib/validations/trip";
import { createTripAction } from "@/actions/trip.actions";
import {
  X,
  Loader2,
  AlertCircle,
  MapPin,
  Truck,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";

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

interface TripWizardFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleSummary[];
  drivers: DriverSummary[];
}

export function TripWizardForm({ isOpen, onClose, vehicles, drivers }: TripWizardFormProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 asset state
  const [availableVehicles, setAvailableVehicles] = useState<VehicleSummary[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverSummary[]>([]);
  const isLoadingAssets = false;

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTripSchema) as any,
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

  // Populate available vehicles and drivers from props on step load
  useEffect(() => {
    if (step === 2 && isOpen) {
      setAvailableVehicles(vehicles.filter(v => v.maxLoadCapacity !== undefined) as VehicleSummary[]);
      setAvailableDrivers(drivers.filter(d => d.licenseCategory && d.safetyScore !== undefined) as DriverSummary[]);
    }
  }, [step, isOpen, vehicles, drivers]);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      reset({
        source: "",
        destination: "",
        plannedDistance: 0,
        cargoWeight: 0,
        revenue: 0,
        vehicleId: "",
        driverId: "",
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const nextStep = async () => {
    // Validate current step input values
    let fieldsToValidate: ("source" | "destination" | "plannedDistance" | "cargoWeight" | "revenue")[] = [];
    if (step === 1) {
      fieldsToValidate = ["source", "destination", "plannedDistance"];
    } else if (step === 2) {
      fieldsToValidate = ["cargoWeight", "revenue"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateTripInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createTripAction(data);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to create trip dispatch.");
      }
    } catch (err) {
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

      {/* Wizard Dialog Container */}
      <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create operations dispatch</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Wizard Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Indicators */}
        <div className="w-full bg-gray-100 h-1 flex">
          <div
            className="bg-primary-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-left">
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-input">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* STEP 1: ROUTE DETAILS */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4" />
                Route Specifications
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Origin / Source <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("source")}
                    placeholder="Chicago Hub"
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  {errors.source && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.source.message}
                    </span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("destination")}
                    placeholder="New York Depot"
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  {errors.destination && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.destination.message}
                    </span>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Planned Distance (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("plannedDistance")}
                    placeholder="1200"
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  {errors.plannedDistance && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.plannedDistance.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FINANCIAL ESTIMATES */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                Dispatch Payload & Income
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Cargo Net Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("cargoWeight")}
                    placeholder="18500"
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  {errors.cargoWeight && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.cargoWeight.message}
                    </span>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Estimated Revenue ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("revenue")}
                    placeholder="4500"
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  {errors.revenue && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.revenue.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ASSET ALLOCATIONS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4" />
                Fleet Resource Linkings
              </div>

              {isLoadingAssets && (
                <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                  <span>Validating active available equipment...</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Vehicle Selection */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Assign Fleet Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("vehicleId")}
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors select-arrow cursor-pointer"
                  >
                    <option value="">-- Choose available vehicle --</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.name} (Max Cap: {v.maxLoadCapacity}kg)
                      </option>
                    ))}
                  </select>
                  {errors.vehicleId && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.vehicleId.message}
                    </span>
                  )}

                  {availableVehicles.length === 0 && (
                    <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      No vehicles are currently registered as AVAILABLE.
                    </div>
                  )}
                </div>

                {/* Driver Selection */}
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Assign Certified Operator <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("driverId")}
                    className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors select-arrow cursor-pointer"
                  >
                    <option value="">-- Choose available driver --</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — Class: {d.licenseCategory} (Safety: {d.safetyScore}/100)
                      </option>
                    ))}
                  </select>
                  {errors.driverId && (
                    <span className="text-xs text-red-650 mt-1 block font-medium">
                      {errors.driverId.message}
                    </span>
                  )}

                  {availableDrivers.length === 0 && (
                    <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      No drivers are currently registered as AVAILABLE.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="h-10 px-5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-button text-sm font-semibold transition-colors disabled:opacity-50"
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
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold transition-colors h-10 px-4"
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="h-10 px-5 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-small"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || availableVehicles.length === 0 || availableDrivers.length === 0}
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-button text-sm font-semibold transition-colors flex items-center gap-2 shadow-small disabled:opacity-40"
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
