"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverSchema } from "@/lib/validations/driver";
import { DriverStatus } from "@prisma/client";
import { createDriverAction, updateDriverAction } from "@/actions/driver.actions";
import { X, Loader2, AlertCircle } from "lucide-react";

interface UserSummary {
  id: string;
  name: string;
  email: string;
}

interface DriverDialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  unlinkedUsers: UserSummary[];
  driver?: {
    id: string;
    name: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiryDate: Date;
    contactNumber: string;
    safetyScore: number;
    status: DriverStatus;
    userId: string | null;
  } | null;
}

export function DriverDialogForm({ isOpen, onClose, unlinkedUsers, driver }: DriverDialogFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!driver;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiryDate: "",
      contactNumber: "",
      safetyScore: 100,
      status: DriverStatus.AVAILABLE,
      userId: "",
    },
  });

  // Populate form defaults when in edit mode
  useEffect(() => {
    if (driver) {
      // Format expiry date to YYYY-MM-DD for date input
      const formattedDate = new Date(driver.licenseExpiryDate)
        .toISOString()
        .split("T")[0];

      reset({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        licenseExpiryDate: formattedDate as unknown as Date,
        contactNumber: driver.contactNumber,
        safetyScore: driver.safetyScore,
        status: driver.status,
        userId: driver.userId || "",
      });
    } else {
      reset({
        name: "",
        licenseNumber: "",
        licenseCategory: "",
        licenseExpiryDate: "",
        contactNumber: "",
        safetyScore: 100,
        status: DriverStatus.AVAILABLE,
        userId: "",
      });
    }
    setError(null);
  }, [driver, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: {
    name: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiryDate: Date;
    contactNumber: string;
    safetyScore: number;
    status: DriverStatus;
    userId?: string | null;
  }) => {
    setIsSubmitting(true);
    setError(null);

    // Convert empty string userId to null
    const payload = {
      ...data,
      userId: data.userId === "" ? null : data.userId,
    };

    try {
      let res;
      if (isEditMode && driver) {
        res = await updateDriverAction(driver.id, payload);
      } else {
        res = await createDriverAction(payload);
      }

      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to save driver details.");
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
            {isEditMode ? "Modify Driver Record" : "Register New Driver"}
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
            {/* Driver Name */}
            <div className="col-span-2">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Driver Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="David Driver"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.name && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* License Number */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                License Number
              </label>
              <input
                type="text"
                {...register("licenseNumber")}
                placeholder="DL-9988776655"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.licenseNumber && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.licenseNumber.message}
                </span>
              )}
            </div>

            {/* License Category */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                License Category
              </label>
              <input
                type="text"
                {...register("licenseCategory")}
                placeholder="Heavy Commercial"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.licenseCategory && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.licenseCategory.message}
                </span>
              )}
            </div>

            {/* Expiry Date */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                License Expiry Date
              </label>
              <input
                type="date"
                {...register("licenseExpiryDate")}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.licenseExpiryDate && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.licenseExpiryDate.message}
                </span>
              )}
            </div>

            {/* Contact Number */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Contact Number
              </label>
              <input
                type="text"
                {...register("contactNumber")}
                placeholder="+1-555-0199"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.contactNumber && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.contactNumber.message}
                </span>
              )}
            </div>

            {/* Safety Score */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Safety Score (0-100)
              </label>
              <input
                type="number"
                {...register("safetyScore")}
                placeholder="100"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              {errors.safetyScore && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.safetyScore.message}
                </span>
              )}
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                {...register("status")}
                disabled={isSubmitting || driver?.status === DriverStatus.ON_TRIP}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value={DriverStatus.AVAILABLE}>Available</option>
                <option value={DriverStatus.OFF_DUTY}>Off Duty</option>
                <option value={DriverStatus.SUSPENDED}>Suspended</option>
                {driver?.status === DriverStatus.ON_TRIP && (
                  <option value={DriverStatus.ON_TRIP}>On Trip</option>
                )}
              </select>
              {errors.status && (
                <span className="text-xs text-rose-400 mt-1 block font-medium">
                  {errors.status.message}
                </span>
              )}
            </div>

            {/* Linked User Account */}
            <div className="col-span-2">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Link User Login Account (Optional)
              </label>
              <select
                {...register("userId")}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="">-- Do Not Link Account --</option>
                {/* If editing, show current linked user if not in unlinkedUsers */}
                {driver && driver.userId && (
                  <option value={driver.userId}>
                    Current: {driver.name} ({driver.userId})
                  </option>
                )}
                {unlinkedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
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
