"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMaintenanceSchema, CreateMaintenanceInput } from "@/lib/validations/maintenance";
import { createMaintenanceLogAction } from "@/actions/maintenance.actions";
import { X, Loader2, AlertCircle } from "lucide-react";

interface VehicleSummary {
  id: string;
  registrationNumber: string;
  name: string;
}

interface MaintenanceDialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleSummary[];
}

export function MaintenanceDialogForm({ isOpen, onClose, vehicles }: MaintenanceDialogFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      vehicleId: "",
      type: "",
      description: "",
      cost: 0,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        vehicleId: "",
        type: "",
        description: "",
        cost: 0,
        startDate: new Date().toISOString().split("T")[0],
      });
      setError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateMaintenanceInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await createMaintenanceLogAction(data);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to schedule maintenance service.");
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
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => { if (!isSubmitting) onClose(); }}></div>

      <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Schedule Maintenance Service</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Log a new maintenance record for a fleet vehicle</p>
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

          <div className="grid grid-cols-2 gap-4">
            {/* Select Vehicle */}
            <div className="col-span-2">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Select Fleet Vehicle <span className="text-red-500">*</span>
              </label>
              <select
                {...register("vehicleId")}
                className="w-full h-[42px] px-4 pr-8 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all appearance-none bg-no-repeat"
                style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E\")", backgroundSize: "1.25rem 1.25rem", backgroundPosition: "right 0.5rem center" }}
              >
                <option value="">-- Choose active asset --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name}
                  </option>
                ))}
              </select>
              {errors.vehicleId && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.vehicleId.message}</span>}
            </div>

            {/* Service Type */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Service Type <span className="text-red-500">*</span>
              </label>
              <input type="text" {...register("type")} placeholder="Scheduled Service / Repair"
                className="w-full h-[42px] px-4 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all" />
              {errors.type && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.type.message}</span>}
            </div>

            {/* Start Date */}
            <div className="col-span-1">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Service Start Date <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register("startDate")}
                className="w-full h-[42px] px-4 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all" />
              {errors.startDate && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.startDate.message}</span>}
            </div>

            {/* Estimated Cost */}
            <div className="col-span-2">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Estimated Cost ($) <span className="text-red-500">*</span>
              </label>
              <input type="number" step="any" {...register("cost")} placeholder="500"
                className="w-full h-[42px] px-4 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all" />
              {errors.cost && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.cost.message}</span>}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Description / Checklist Details
              </label>
              <textarea {...register("description")}
                placeholder="Routine service checklist: change motor oil, replace oil filter, check brake fluid levels..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-all resize-none" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="h-10 px-5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-button text-sm font-semibold transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="h-10 px-5 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-small">
              {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Scheduling...</>) : ("Confirm Schedule")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
