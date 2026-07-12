"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import {
  createMaintenanceLog,
  resolveMaintenanceLog,
  MaintenanceServiceError,
} from "@/lib/domain/maintenance.service";
import { CreateMaintenanceInput, ResolveMaintenanceInput } from "@/lib/validations/maintenance";
import { revalidatePath } from "next/cache";

export async function createMaintenanceLogAction(input: CreateMaintenanceInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_MAINTENANCE");

    const log = await createMaintenanceLog(input);
    revalidatePath("/maintenance");
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${input.vehicleId}`);
    return { success: true, data: log };
  } catch (error: unknown) {
    console.error("Action error creating maintenance log:", error);
    if (error instanceof MaintenanceServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to schedule maintenance.";
    return { success: false, error: message };
  }
}

export async function resolveMaintenanceLogAction(logId: string, input: ResolveMaintenanceInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_MAINTENANCE");

    const log = await resolveMaintenanceLog(logId, session?.user?.id || "", input);
    revalidatePath("/maintenance");
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${log.vehicleId}`);
    return { success: true, data: log };
  } catch (error: unknown) {
    console.error(`Action error resolving maintenance log ${logId}:`, error);
    if (error instanceof MaintenanceServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to resolve maintenance service.";
    return { success: false, error: message };
  }
}
