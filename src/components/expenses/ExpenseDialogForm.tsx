"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, CreateExpenseInput } from "@/lib/validations/expense";
import { createExpenseAction } from "@/actions/expense.actions";
import { ExpenseType } from "@prisma/client";
import { X, Loader2, AlertCircle } from "lucide-react";

interface VehicleSummary {
  id: string;
  registrationNumber: string;
  name: string;
}

interface ExpenseDialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleSummary[];
}

export function ExpenseDialogForm({ isOpen, onClose, vehicles }: ExpenseDialogFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      vehicleId: "",
      type: ExpenseType.TOLL,
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        vehicleId: "",
        type: ExpenseType.TOLL,
        amount: 0,
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreateExpenseInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createExpenseAction(data);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to record general expense.");
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
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Log general expense</h2>
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

          <div className="space-y-4">
            {/* Select Vehicle */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Vehicle <span className="text-red-500">*</span>
              </label>
              <select
                {...register("vehicleId")}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors select-arrow cursor-pointer"
              >
                <option value="">-- Select fleet vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.name}
                  </option>
                ))}
              </select>
              {errors.vehicleId && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.vehicleId.message}
                </span>
              )}
            </div>

            {/* Expense Type */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type")}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors select-arrow cursor-pointer"
              >
                <option value={ExpenseType.TOLL}>Toll</option>
                <option value={ExpenseType.MAINTENANCE}>Maintenance Fee</option>
                <option value={ExpenseType.OTHER}>Other Operational Expense</option>
              </select>
              {errors.type && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.type.message}
                </span>
              )}
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                  Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  {...register("amount")}
                  placeholder="120"
                  className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                />
                {errors.amount && (
                  <span className="text-xs text-red-600 mt-1 block font-medium">
                    {errors.amount.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                  Record Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("date")}
                  className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
                />
                {errors.date && (
                  <span className="text-xs text-red-600 mt-1 block font-medium">
                    {errors.date.message}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Description / Notes Details
              </label>
              <input
                type="text"
                {...register("description")}
                placeholder="Toll tax highway pass / tire replacement etc."
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
              />
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
              className="h-10 px-5 bg-primary-500 hover:bg-primary-600 text-white rounded-button text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Record Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
