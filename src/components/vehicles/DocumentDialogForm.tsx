"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { uploadVehicleDocumentAction } from "@/actions/document.actions";
import { X, Loader2, AlertCircle } from "lucide-react";

const documentSchema = z.object({
  type: z.string().min(2, "Document type is required").trim(),
  fileUrl: z.string().min(1, "File path is required").trim(),
  expiryDate: z.string().optional(),
});

type DocumentInput = z.infer<typeof documentSchema>;

interface DocumentDialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
}

export function DocumentDialogForm({ isOpen, onClose, vehicleId }: DocumentDialogFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: "Registration",
      fileUrl: "/uploads/registration_doc.pdf",
      expiryDate: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        type: "Registration",
        fileUrl: "/uploads/registration_doc.pdf",
        expiryDate: "",
      });
      setError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: DocumentInput) => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...data,
      vehicleId,
      expiryDate: data.expiryDate === "" ? undefined : data.expiryDate,
    };

    try {
      const res = await uploadVehicleDocumentAction(payload);
      if (res.success) {
        onClose();
        reset();
      } else {
        setError(res.error || "Failed to register document.");
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

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-modal shadow-large overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Add compliance document</h2>
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
            {/* Document Type */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type")}
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors select-arrow cursor-pointer"
              >
                <option value="Registration">Registration Certificate (RC)</option>
                <option value="Insurance">Commercial Insurance policy</option>
                <option value="Permit">Interstate Permit pass</option>
                <option value="PUC">Pollution Under Control (PUC)</option>
              </select>
            </div>

            {/* File Path */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Document File Path <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("fileUrl")}
                placeholder="/uploads/permit_doc.pdf"
                className="w-full h-[42px] px-3.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors"
              />
              {errors.fileUrl && (
                <span className="text-xs text-red-600 mt-1 block font-medium">
                  {errors.fileUrl.message}
                </span>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold uppercase tracking-wider mb-2">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                {...register("expiryDate")}
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
                  Adding...
                </>
              ) : (
                "Add Document"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
