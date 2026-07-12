import { z } from "zod";
import { VehicleStatus } from "@prisma/client";

export const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(3, "Registration number must be at least 3 characters")
    .max(20, "Registration number must be at most 20 characters")
    .trim()
    .toUpperCase(),
  name: z.string().min(2, "Vehicle name must be at least 2 characters").trim(),
  type: z.string().min(2, "Vehicle type must be at least 2 characters").trim(),
  maxLoadCapacity: z.coerce.number().positive("Max load capacity must be a positive number"),
  odometer: z.coerce.number().nonnegative("Odometer must be a non-negative number"),
  acquisitionCost: z.coerce.number().positive("Acquisition cost must be a positive number"),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  region: z.string().trim().nullable().optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
