"use client";

import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import React from "react";

interface RoleGateProps {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGate hides/shows content on the client based on the user's role.
 * Remember to also enforce role checks on the server-side actions/APIs.
 */
export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null; // Or a skeleton placeholder
  }

  const role = session?.user?.role;

  if (!role || !allow.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
