"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { runCronChecks } from "@/lib/domain/cron.service";
import { revalidatePath } from "next/cache";

export async function runCronChecksAction() {
  const session = await auth();

  try {
    // Only Fleet Managers or Admins can simulate/run scheduler audits
    assertPermission(session?.user?.role, "MANAGE_VEHICLES");

    const result = await runCronChecks();

    // Revalidate paths to update alert indicators in panels
    revalidatePath("/compliance");
    revalidatePath("/dashboard");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");

    return { success: true, ...result };
  } catch (error: unknown) {
    console.error("Action error running cron checks:", error);
    const message = error instanceof Error ? error.message : "Failed to run scheduler audit.";
    return { success: false, error: message };
  }
}
