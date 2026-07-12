import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          try {
            const user = await prisma.user.findUnique({
              where: { email },
              include: { driver: true },
            });
            
            if (!user) {
              console.log("No user found with email:", email);
              return null;
            }

            const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
            
            if (passwordsMatch) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                driverId: user.driver?.id || null,
              };
            } else {
              console.log("Invalid password for user:", email);
            }
          } catch (error) {
            console.error("Database error during authorization:", error);
            return null;
          }
        }
        
        return null;
      },
    }),
  ],
});
