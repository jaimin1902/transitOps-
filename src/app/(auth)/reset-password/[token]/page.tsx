"use client";

import React, { useState } from "react";
import { resetPasswordAction } from "@/actions/auth.actions";
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPasswordAction(params.token, password);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during password reset.");
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
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set New Password</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">
            Enter and confirm your new secure account password
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm rounded-xl">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Password updated successfully</p>
                <p className="text-xs text-slate-300">
                  Your new credentials have been locked into the system. Any account lockouts have been reset.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              Sign In with New Password &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
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
                "Save Password Credentials"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
