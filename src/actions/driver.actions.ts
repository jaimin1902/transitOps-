"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import {
  createDriver,
  updateDriver,
  suspendDriver,
  sendComplianceReminder,
  updateSafetyScore,
  DriverServiceError,
} from "@/lib/domain/driver.service";
import { DriverInput } from "@/lib/validations/driver";
import { revalidatePath } from "next/cache";

export async function createDriverAction(input: DriverInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_DRIVERS");

    const driver = await createDriver(input);
    revalidatePath("/drivers");
    return { success: true, data: driver };
  } catch (error: unknown) {
    console.error("Action error creating driver:", error);
    if (error instanceof DriverServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to create driver record.";
    return { success: false, error: message };
  }
}

export async function updateDriverAction(id: string, input: Partial<DriverInput>) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_DRIVERS");

    const driver = await updateDriver(id, input);
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    revalidatePath("/compliance");
    return { success: true, data: driver };
  } catch (error: unknown) {
    console.error(`Action error updating driver ${id}:`, error);
    if (error instanceof DriverServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to update driver details.";
    return { success: false, error: message };
  }
}

export async function suspendDriverAction(id: string) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_DRIVERS");

    const driver = await suspendDriver(id);
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    revalidatePath("/compliance");
    return { success: true, data: driver };
  } catch (error: unknown) {
    console.error(`Action error suspending driver ${id}:`, error);
    if (error instanceof DriverServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to suspend driver.";
    return { success: false, error: message };
  }
}

export async function sendComplianceReminderAction(driverId: string) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "VIEW_COMPLIANCE");

    const log = await sendComplianceReminder(driverId);
    revalidatePath("/compliance");
    return { success: true, data: log };
  } catch (error: unknown) {
    console.error(`Action error sending compliance reminder to driver ${driverId}:`, error);
    if (error instanceof DriverServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to trigger compliance reminder alert.";
    return { success: false, error: message };
  }
}

export async function updateSafetyScoreAction(driverId: string, delta: number, reason: string) {
  const session = await auth();

  try {
    // Safety Officer and Admin only
    assertPermission(session?.user?.role, "MANAGE_DRIVERS");

    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "Unauthenticated." };

    const result = await updateSafetyScore(driverId, delta, reason, userId);
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${driverId}`);
    revalidatePath("/compliance");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error(`Action error updating safety score for driver ${driverId}:`, error);
    if (error instanceof DriverServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to update safety score.";
    return { success: false, error: message };
  }
}
