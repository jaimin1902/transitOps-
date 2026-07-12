"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveMaintenanceSchema, ResolveMaintenanceInput } from "@/lib/validations/maintenance";
import { resolveMaintenanceLogAction } from "@/actions/maintenance.actions";
import { X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface MaintenanceResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    id: string;
    type: string;
    cost: number;
    vehicle: {
      registrationNumber: string;
    };
  } | null;
}

export function MaintenanceResolveModal({ isOpen, onClose, log }: MaintenanceResolveModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resolveMaintenanceSchema),
    defaultValues: {
      cost: 0,
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (log) {
      reset({
        cost: Number(log.cost),
        endDate: new Date().toISOString().split("T")[0],
      });
    }
    setError(null);
  }, [log, reset, isOpen]);

  if (!isOpen || !log) return null;

  const onSubmit = async (data: ResolveMaintenanceInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await resolveMaintenanceLogAction(log.id, data);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to resolve maintenance.");
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

      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Resolve Maintenance</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Finalize service costs and logs</p>
            </div>
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
            {/* Asset Details */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Vehicle:</span>
                <span className="font-mono font-bold text-indigo-600">{log.vehicle.registrationNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Service:</span>
                <span className="font-bold text-gray-900">{log.type}</span>
              </div>
            </div>

            {/* Input Cost */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Final Billable Cost ($) <span className="text-red-500">*</span>
              </label>
              <input type="number" step="any" {...register("cost")} disabled={isSubmitting}
                className="w-full h-[42px] px-4 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50" />
              {errors.cost && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.cost.message}</span>}
            </div>

            {/* Input End Date */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Completion / End Date <span className="text-red-500">*</span>
              </label>
              <input type="date" {...register("endDate")} disabled={isSubmitting}
                className="w-full h-[42px] px-4 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50" />
              {errors.endDate && <span className="text-xs text-red-600 mt-1 block font-medium">{errors.endDate.message}</span>}
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
              {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" />Resolving...</>) : ("Confirm Resolve")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
