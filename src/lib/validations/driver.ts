import { z } from "zod";
import { DriverStatus } from "@prisma/client";

export const driverSchema = z.object({
  name: z.string().min(2, "Driver name must be at least 2 characters").trim(),
  licenseNumber: z
    .string()
    .min(3, "License number must be at least 3 characters")
    .trim()
    .toUpperCase(),
  licenseCategory: z.string().min(2, "License category must be at least 2 characters").trim(),
  licenseExpiryDate: z.coerce.date({
    message: "License expiry date must be a valid date",
  }),
  contactNumber: z
    .string()
    .min(5, "Contact number must be at least 5 characters")
    .trim(),
  safetyScore: z.coerce
    .number()
    .min(0, "Safety score cannot be less than 0")
    .max(100, "Safety score cannot exceed 100")
    .default(100),
  status: z.nativeEnum(DriverStatus).default(DriverStatus.AVAILABLE),
  userId: z.string().trim().nullable().optional(),
});

export type DriverInput = z.infer<typeof driverSchema>;
