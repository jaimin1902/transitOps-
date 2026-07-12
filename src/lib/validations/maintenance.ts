import { z } from "zod";
import { MaintenanceStatus } from "@prisma/client";

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.string().min(2, "Maintenance type must be at least 2 characters").trim(),
  description: z.string().trim().nullable().optional(),
  cost: z.coerce.number().nonnegative("Estimated cost cannot be negative").default(0),
  status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.OPEN),
  startDate: z.coerce.date().default(() => new Date()),
});

export const resolveMaintenanceSchema = z.object({
  cost: z.coerce.number().nonnegative("Final cost cannot be negative"),
  endDate: z.coerce.date().default(() => new Date()),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type ResolveMaintenanceInput = z.infer<typeof resolveMaintenanceSchema>;
