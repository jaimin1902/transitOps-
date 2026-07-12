import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { GlobalSearchBar } from "@/components/shared/GlobalSearchBar";
import { SidebarNav } from "@/components/shared/SidebarNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  return (
    <div className="flex h-screen bg-[#F5F7FA] text-gray-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div className="flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 gap-2 shrink-0 bg-white">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white shadow-small">
              T
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">TransitOps</span>
          </div>

          <SidebarNav role={role} />
        </div>

        {/* Logout Button Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#F5F7FA] relative">
        {/* Top Header */}
        <header className="sticky top-0 h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
          <GlobalSearchBar />
          <div className="flex items-center gap-4 text-xs font-semibold px-3 py-1.5 bg-green-50 rounded-full border border-green-200 text-green-800 shadow-small">
            <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse"></span>
            System Live
          </div>
        </header>

        {/* Dashboard Pages Root */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
