import type { NextAuthConfig } from "next-auth";
import { Role } from "@prisma/client";
import "next-auth/jwt";

// Module augmentation for TypeScript type safety
declare module "next-auth" {
  interface User {
    id?: string;
    role: Role;
    driverId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      driverId?: string | null;
    } & import("next-auth").DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    driverId?: string | null;
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isAuthPage = nextUrl.pathname === "/login";

      // Allow public/static files and Auth APIs without checks
      if (
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/static") ||
        nextUrl.pathname.startsWith("/favicon.ico") ||
        nextUrl.pathname.startsWith("/api/auth")
      ) {
        return true;
      }

      // Allow APIs but we let standard endpoint handlers check session
      if (isApiRoute) {
        return true;
      }

      const isDashboardRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/vehicles") ||
        nextUrl.pathname.startsWith("/drivers") ||
        nextUrl.pathname.startsWith("/trips") ||
        nextUrl.pathname.startsWith("/maintenance") ||
        nextUrl.pathname.startsWith("/fuel-expenses") ||
        nextUrl.pathname.startsWith("/reports") ||
        nextUrl.pathname.startsWith("/compliance");

      if (isDashboardRoute) {
        if (isLoggedIn) {
          // Role specific path protections
          const role = auth?.user?.role;
          if (nextUrl.pathname.startsWith("/compliance") && role !== "SAFETY_OFFICER" && role !== "ADMIN") {
            return Response.redirect(new URL("/dashboard", nextUrl));
          }
          if (nextUrl.pathname.startsWith("/reports") && role === "DISPATCHER") {
            return Response.redirect(new URL("/dashboard", nextUrl));
          }
          return true;
        }
        return false; // Redirect unauthenticated to login
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Root route redirect to dashboard if logged in, else login
      if (nextUrl.pathname === "/") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || "";
        token.role = user.role;
        token.driverId = user.driverId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.driverId = token.driverId;
      }
      return session;
    },
  },
  providers: [], // Configured inside src/lib/auth.ts
};
