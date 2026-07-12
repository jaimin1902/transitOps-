"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadVehicleDocumentAction(data: {
  vehicleId: string;
  type: string;
  fileUrl: string;
  expiryDate?: string;
}) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_VEHICLES");

    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId: data.vehicleId,
        type: data.type,
        fileUrl: data.fileUrl || "/uploads/mock_document.pdf",
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });

    revalidatePath(`/vehicles/${data.vehicleId}`);
    return { success: true, data: document };
  } catch (error: unknown) {
    console.error("Action error uploading vehicle document:", error);
    const message = error instanceof Error ? error.message : "Failed to save vehicle document.";
    return { success: false, error: message };
  }
}
