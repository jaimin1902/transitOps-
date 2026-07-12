"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import {
  createVehicle,
  updateVehicle,
  retireVehicle,
  VehicleServiceError,
} from "@/lib/domain/vehicle.service";
import { VehicleInput } from "@/lib/validations/vehicle";
import { revalidatePath } from "next/cache";

export async function createVehicleAction(input: VehicleInput) {
  const session = await auth();
  
  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_VEHICLES");

    const vehicle = await createVehicle(input);
    revalidatePath("/vehicles");
    return { success: true, data: vehicle };
  } catch (error: unknown) {
    console.error("Action error creating vehicle:", error);
    if (error instanceof VehicleServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to create vehicle.";
    return { success: false, error: message };
  }
}

export async function updateVehicleAction(id: string, input: Partial<VehicleInput>) {
  const session = await auth();
  
  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_VEHICLES");

    const vehicle = await updateVehicle(id, input);
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { success: true, data: vehicle };
  } catch (error: unknown) {
    console.error(`Action error updating vehicle ${id}:`, error);
    if (error instanceof VehicleServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to update vehicle.";
    return { success: false, error: message };
  }
}

export async function retireVehicleAction(id: string) {
  const session = await auth();
  
  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_VEHICLES");

    const vehicle = await retireVehicle(id);
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { success: true, data: vehicle };
  } catch (error: unknown) {
    console.error(`Action error retiring vehicle ${id}:`, error);
    if (error instanceof VehicleServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to retire vehicle.";
    return { success: false, error: message };
  }
}
