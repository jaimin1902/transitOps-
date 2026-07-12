"use client";

import React, { useState } from "react";
import { BarChart3, ListFilter, ShieldCheck } from "lucide-react";

interface AnalyticsWorkspaceProps {
  reportWorkspace: React.ReactNode;
  financialDashboard: React.ReactNode;
}

export function AnalyticsWorkspace({ reportWorkspace, financialDashboard }: AnalyticsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"financial" | "audit">("financial");

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-150">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 text-primary-500 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            Operations Analytics Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Financial & Performance Hub
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Analyze vehicle return on investment, operational costs, export csv audits, and log monthly revenue entries.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 shadow-inner">
          <button
            onClick={() => setActiveTab("financial")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "financial"
                ? "bg-white text-gray-900 shadow-small"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Financial ROI Dashboard
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "audit"
                ? "bg-white text-gray-900 shadow-small"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Audit Reports & Export
          </button>
        </div>
      </div>

      {/* Render active dashboard workspace */}
      <div className="transition-all duration-300">
        {activeTab === "financial" ? financialDashboard : reportWorkspace}
      </div>
    </div>
  );
}
