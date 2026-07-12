import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().min(2, "Source location must be at least 2 characters").trim(),
  destination: z.string().min(2, "Destination location must be at least 2 characters").trim(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeight: z.coerce.number().positive("Cargo weight must be a positive number"),
  plannedDistance: z.coerce.number().positive("Planned distance must be a positive number"),
  revenue: z.coerce.number().nonnegative("Revenue cannot be negative").default(0),
});

export const dispatchTripSchema = z.object({
  startOdometer: z.coerce.number().nonnegative("Start odometer cannot be negative"),
});

export const completeTripSchema = z.object({
  endOdometer: z.coerce.number().nonnegative("End odometer cannot be negative"),
  actualDistance: z.coerce.number().positive("Actual distance must be a positive number"),
  fuelConsumed: z.coerce.number().positive("Fuel consumed must be a positive number"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type DispatchTripInput = z.infer<typeof dispatchTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
