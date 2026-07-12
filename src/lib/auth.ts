import NextAuth, { CredentialsSignin } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export class InvalidCredentialsError extends CredentialsSignin {
  code = "INVALID_CREDENTIALS";
}

export class AccountLockedError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED";
  constructor(minutesLeft: number) {
    super();
    this.code = `ACCOUNT_LOCKED:${minutesLeft}`;
  }
}


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
              throw new InvalidCredentialsError();
            }

            // Check if account is locked
            if (user.lockedUntil && user.lockedUntil > new Date()) {
              const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
              throw new AccountLockedError(minutesLeft);
            }

            // If lock has expired, reset attempts
            if (user.lockedUntil && user.lockedUntil <= new Date()) {
              await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, lockedUntil: null },
              });
              user.failedLoginAttempts = 0;
              user.lockedUntil = null;
            }

            const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
            
            if (passwordsMatch) {
              // Reset attempts on successful login
              await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, lockedUntil: null },
              });

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                driverId: user.driver?.id || null,
              };
            } else {
              // Increment failed login attempts
              const newAttempts = user.failedLoginAttempts + 1;
              let lockedUntil: Date | null = null;
              if (newAttempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
              }

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: newAttempts,
                  lockedUntil,
                },
              });

              if (newAttempts >= 5) {
                throw new AccountLockedError(15);
              }
              throw new InvalidCredentialsError();
            }
          } catch (error) {
            console.error("Database error during authorization:", error);
            if (error instanceof CredentialsSignin) {
              throw error;
            }
            throw new InvalidCredentialsError();
          }
        }
        
        return null;
      },
    }),
  ],
});
