import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, Sparkles, UserCheck } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 overflow-hidden shadow-xl group">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-all"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome Back
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Hello, {user.name}
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl">
              You are signed in as a <span className="text-indigo-400 font-semibold">{user.role.replace("_", " ")}</span>. Use the sidebar menu to navigate through your authorized workspaces.
            </p>
          </div>
          
          <div className="flex gap-4 shrink-0">
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center w-28 shadow-inner">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Role</span>
              <div className="w-7 h-7 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center mb-1">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase truncate max-w-full px-1">
                {user.role.split("_")[0]}
              </span>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center w-28 shadow-inner">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</span>
              <div className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center mb-1">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold text-white mb-2">Fleet Management</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Monitor vehicle availability, check maintenance logs, and audit operational logistics.
          </p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold text-white mb-2">Safety & Compliance</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Check driver safety scores, monitor driver license validity, and approve dispatches safely.
          </p>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-850 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold text-white mb-2">Financial Reports</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Analyze fuel efficiencies, count operational expenses, and audit vehicle ROI metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
