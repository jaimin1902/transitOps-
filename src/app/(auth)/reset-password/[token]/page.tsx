"use client";

import React, { useState } from "react";
import { resetPasswordAction } from "@/actions/auth.actions";
import { Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface ResetPasswordPageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const token = params.token;
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

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await resetPasswordAction(token, password);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
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
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create New Password</h1>
          <p className="text-gray-500 mt-2 text-sm font-semibold">
            Choose a secure, strong password for your credentials
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-rose-50 border border-rose-250 text-rose-700 text-xs rounded-xl font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-xl">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Password updated successfully</p>
                <p className="text-xs text-gray-500">
                  Your new credentials have been locked into the system. Any account lockouts have been reset.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-small hover:shadow-medium"
            >
              Sign In with New Password &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-left">
              <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl focus:outline-none focus:border-primary-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-450 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-left">
              <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm rounded-xl focus:outline-none focus:border-primary-500 transition-all disabled:opacity-50"
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
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
