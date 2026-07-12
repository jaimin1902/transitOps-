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
    <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-3xl shadow-xl relative overflow-hidden group">
      {/* Decorative gradient overlay */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-50/20 rounded-full blur-3xl group-hover:bg-primary-50/40 transition-colors duration-500"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-50/20 rounded-full blur-3xl group-hover:bg-amber-50/40 transition-colors duration-500"></div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 border border-primary-100 text-primary-600 rounded-2xl mb-4 shadow-inner">
            <Mail className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reset Password</h1>
          <p className="text-gray-500 mt-2 text-sm font-semibold">
            Enter your registered email to request a reset link
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-rose-50 border border-rose-250 text-rose-700 text-xs rounded-xl font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-2">
                <p className="font-bold">Reset request processed</p>
                <p className="text-xs text-gray-500">
                  We have simulated the password reset dispatch process. In production, this would send an email with the verification token link.
                </p>
              </div>
            </div>

            {simulatedLink && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5 text-left">
                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                  Simulated Reset Link (Local Developer Dev-Mode):
                </p>
                <a
                  href={simulatedLink}
                  className="block text-xs font-mono break-all text-amber-600 hover:text-amber-700 underline font-bold transition-colors"
                >
                  {simulatedLink}
                </a>
              </div>
            )}

            <Link
              href="/login"
              className="w-full h-11 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl border border-gray-300 transition-all flex items-center justify-center gap-2 shadow-small"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-left">
              <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@transitops.com"
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl focus:outline-none focus:border-primary-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-xl shadow-small hover:shadow-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Request Reset Link"
              )}
            </button>

            <Link
              href="/login"
              className="w-full h-11 bg-transparent hover:bg-gray-50 text-gray-500 hover:text-gray-700 text-sm font-bold rounded-xl border border-transparent transition-all flex items-center justify-center gap-2"
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
