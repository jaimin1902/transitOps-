"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { createFuelLog, createExpense } from "@/lib/domain/expense.service";
import { CreateFuelLogInput, CreateExpenseInput } from "@/lib/validations/expense";
import { revalidatePath } from "next/cache";

export async function createFuelLogAction(input: CreateFuelLogInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_FUEL_EXPENSES");

    const fuelLog = await createFuelLog(input);
    revalidatePath("/expenses");
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${input.vehicleId}`);
    return { success: true, data: fuelLog };
  } catch (error: unknown) {
    console.error("Action error logging fuel:", error);
    const message = error instanceof Error ? error.message : "Failed to record fuel purchase.";
    return { success: false, error: message };
  }
}

export async function createExpenseAction(input: CreateExpenseInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_FUEL_EXPENSES");

    const expenseLog = await createExpense(input);
    revalidatePath("/expenses");
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${input.vehicleId}`);
    return { success: true, data: expenseLog };
  } catch (error: unknown) {
    console.error("Action error logging expense:", error);
    const message = error instanceof Error ? error.message : "Failed to record expense.";
    return { success: false, error: message };
  }
}
