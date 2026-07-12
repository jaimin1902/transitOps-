"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.log("NextAuth error:", result.error);
        if (result.error === "INVALID_CREDENTIALS" || result.error === "CredentialsSignin") {
          setError("Invalid email or password.");
        } else if (result.error.startsWith("ACCOUNT_LOCKED")) {
          const minutes = result.error.split(":")[1] || "15";
          setError(`Your account is locked. Please try again in ${minutes} minutes.`);
        } else {
          setError("Invalid email or password. Too many failed attempts will lock your account.");
        }
        setIsLoading(false);
      } else {
        // Success: Redirect to dashboard
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to authentication server.");
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
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">TransitOps</h1>
          <p className="text-gray-500 mt-2 text-sm font-semibold">
            Smart Transport Operations Platform
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

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

          <div className="text-left">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider">
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors"
              >
                Forgot password?
              </a>
            </div>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-xl shadow-small hover:shadow-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <span className="inline-block transform group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-150 text-center">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">
            Secure admin portal. Unauthorized access is strictly logged.
          </p>
        </div>
      </div>
    </div>
  );
}
