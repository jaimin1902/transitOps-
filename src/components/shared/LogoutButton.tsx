"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-all font-medium text-sm text-left"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  );
}
