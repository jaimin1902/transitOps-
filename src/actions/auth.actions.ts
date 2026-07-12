"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Generate password reset token and log/simulate emailing it
 */
export async function generateResetTokenAction(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success to prevent email enumeration attacks
      return {
        success: true,
        message: "If the email is registered, a password reset link has been dispatched.",
      };
    }

    // Generate token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store in DB
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Simulate sending email by logging to console
    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    console.log(`\n======================================================`);
    console.log(`[SIMULATED EMAIL] Password reset requested for: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`======================================================\n`);

    return {
      success: true,
      message: "If the email is registered, a password reset link has been dispatched.",
      simulatedLink: resetUrl, // Return for easier developer testing
    };
  } catch (error) {
    console.error("Error generating reset token:", error);
    return { success: false, error: "Failed to process password reset request." };
  }
}

/**
 * Reset password using token
 */
export async function resetPasswordAction(token: string, passwordHashRaw: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { success: false, error: "Invalid password reset token." };
    }

    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return { success: false, error: "This password reset token has expired." };
    }

    // Hash the new password
    const passwordHash = bcrypt.hashSync(passwordHashRaw, 10);

    // Update user password and reset lockout limits atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      // Delete the token so it cannot be reused
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password." };
  }
}
