"use client";

import React, { useState } from "react";
import { updateSettingsAction } from "@/actions/settings.actions";
import { Settings } from "@prisma/client";
import { Loader2, Save, Warehouse } from "lucide-react";

interface OrgSettingsFormProps {
  initialSettings: Settings;
}

export function OrgSettingsForm({ initialSettings }: OrgSettingsFormProps) {
  const [depotName, setDepotName] = useState(initialSettings.depotName);
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [distanceUnit, setDistanceUnit] = useState(initialSettings.distanceUnit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateSettingsAction({ depotName, currency, distanceUnit });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-150">
        <Warehouse className="w-5 h-5 text-primary-500" />
        <h3 className="text-base font-bold text-gray-900">Depot & Localization Settings</h3>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-150 text-red-700 text-sm rounded-input font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-sm rounded-input font-medium">
          General settings updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Primary Depot Name
          </label>
          <input
            type="text"
            required
            value={depotName}
            onChange={(e) => setDepotName(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors shadow-inner"
            placeholder="e.g. TransitOps Depot"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Currency (ISO Code)
          </label>
          <input
            type="text"
            required
            maxLength={3}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className="w-full h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors shadow-inner font-mono"
            placeholder="e.g. USD, INR, EUR"
          />
        </div>

        <div className="space-y-1.5 font-sans">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Distance Measurement Unit
          </label>
          <div className="relative">
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-input focus:outline-none focus:border-primary-500 transition-colors cursor-pointer appearance-none pr-8 select-arrow"
            >
              <option value="km">Kilometers (km)</option>
              <option value="miles">Miles (miles)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-5 bg-primary-600 hover:bg-primary-750 text-white rounded-button text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-small disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Localization Settings
        </button>
      </div>
    </form>
  );
}
