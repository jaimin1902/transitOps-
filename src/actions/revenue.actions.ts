"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logRevenueAction(vehicleId: string, monthStr: string, amount: number) {
  const session = await auth();

  try {
    assertPermission(session?.user?.role, "VIEW_REPORTS");

    if (!vehicleId) {
      return { success: false, error: "Vehicle is required." };
    }

    if (!monthStr) {
      return { success: false, error: "Month selection is required." };
    }

    if (amount < 0) {
      return { success: false, error: "Revenue amount cannot be negative." };
    }

    const monthDate = new Date(monthStr);
    monthDate.setDate(1);
    monthDate.setHours(0, 0, 0, 0);

    const entry = await prisma.revenueEntry.upsert({
      where: {
        vehicleId_month: {
          vehicleId,
          month: monthDate,
        },
      },
      update: { amount },
      create: { vehicleId, month: monthDate, amount },
    });

    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    return { success: true, data: entry };
  } catch (error: unknown) {
    console.error("Action error logging revenue:", error);
    const message = error instanceof Error ? error.message : "Failed to log vehicle revenue.";
    return { success: false, error: message };
  }
}
