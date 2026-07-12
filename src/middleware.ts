import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Guard all paths except static files, favicon, etc.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
