"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { updateSettings, updateRolePermission, SettingsServiceError } from "@/lib/domain/settings.service";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(data: { depotName: string; currency: string; distanceUnit: string }) {
  const session = await auth();

  try {
    assertPermission(session?.user?.role, "MANAGE_SETTINGS");

    const settings = await updateSettings(data);
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, data: settings };
  } catch (error: unknown) {
    console.error("Action error updating settings:", error);
    if (error instanceof SettingsServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to update system settings.";
    return { success: false, error: message };
  }
}

export async function updateRolePermissionAction(role: Role, module: string, access: string) {
  const session = await auth();

  try {
    assertPermission(session?.user?.role, "MANAGE_SETTINGS");

    const perm = await updateRolePermission(role, module, access);
    revalidatePath("/settings");
    // Revalidate other paths since permission changes affect access
    revalidatePath("/fleet");
    revalidatePath("/drivers");
    revalidatePath("/trips");
    revalidatePath("/maintenance");
    revalidatePath("/expenses");
    revalidatePath("/analytics");
    return { success: true, data: perm };
  } catch (error: unknown) {
    console.error(`Action error updating permission for role ${role} module ${module}:`, error);
    if (error instanceof SettingsServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to update role permissions.";
    return { success: false, error: message };
  }
}
