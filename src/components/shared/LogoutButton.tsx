"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-[8px] transition-all font-semibold text-sm text-left"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  );
}
