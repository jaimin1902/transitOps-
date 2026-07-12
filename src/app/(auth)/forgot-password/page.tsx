"use client";

import React, { useState } from "react";
import { generateResetTokenAction } from "@/actions/auth.actions";
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [simulatedLink, setSimulatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setSimulatedLink(null);

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateResetTokenAction(email);
      if (result.success) {
        setSuccessMessage(result.message || "Reset link sent.");
        if (result.simulatedLink) {
          setSimulatedLink(result.simulatedLink);
        }
      } else {
        setError(result.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send reset request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden group">
      {/* Decorative gradient overlay */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl group-hover:bg-indigo-600/40 transition-colors duration-500"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-violet-600/30 rounded-full blur-3xl group-hover:bg-violet-600/40 transition-colors duration-500"></div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mb-4 shadow-inner">
            <Mail className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            Enter your registered email to request a reset link
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm rounded-xl">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold">Reset request processed</p>
                <p className="text-xs text-slate-300">
                  We have simulated the password reset dispatch process. In production, this would send an email with the verification token link.
                </p>
              </div>
            </div>

            {simulatedLink && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Simulated Reset Link (Local Developer Dev-Mode):
                </p>
                <a
                  href={simulatedLink}
                  className="block text-xs font-mono break-all text-violet-400 hover:text-violet-300 underline font-semibold transition-colors"
                >
                  {simulatedLink}
                </a>
              </div>
            )}

            <Link
              href="/login"
              className="w-full h-11 bg-slate-850 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl border border-slate-750 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@transitops.com"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Request Reset Link"
              )}
            </button>

            <Link
              href="/login"
              className="w-full h-11 bg-transparent hover:bg-slate-800/40 text-slate-300 hover:text-white text-sm font-semibold rounded-xl border border-transparent transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel & Return
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
