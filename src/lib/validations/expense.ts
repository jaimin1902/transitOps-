import { z } from "zod";
import { ExpenseType } from "@prisma/client";

export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().trim().nullable().optional(),
  liters: z.coerce.number().positive("Liters must be a positive number"),
  cost: z.coerce.number().positive("Cost must be a positive number"),
  date: z.coerce.date().default(() => new Date()),
});

export const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.nativeEnum(ExpenseType),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.coerce.date().default(() => new Date()),
  description: z.string().trim().nullable().optional(),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
