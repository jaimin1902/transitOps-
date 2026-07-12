import { Role } from "@prisma/client";

// Define the permissions check mapping based on the plan's matrix
export type ActionType =
  | "MANAGE_VEHICLES"
  | "VIEW_VEHICLES"
  | "MANAGE_DRIVERS"
  | "VIEW_DRIVERS"
  | "MANAGE_TRIPS"
  | "VIEW_TRIPS"
  | "MANAGE_MAINTENANCE"
  | "VIEW_MAINTENANCE"
  | "MANAGE_FUEL_EXPENSES"
  | "VIEW_FUEL_EXPENSES"
  | "VIEW_REPORTS"
  | "VIEW_COMPLIANCE";

const PERMISSION_MATRIX: Record<Role, Partial<Record<ActionType, boolean>>> = {
  ADMIN: {
    MANAGE_VEHICLES: true,
    VIEW_VEHICLES: true,
    MANAGE_DRIVERS: true,
    VIEW_DRIVERS: true,
    MANAGE_TRIPS: true,
    VIEW_TRIPS: true,
    MANAGE_MAINTENANCE: true,
    VIEW_MAINTENANCE: true,
    MANAGE_FUEL_EXPENSES: true,
    VIEW_FUEL_EXPENSES: true,
    VIEW_REPORTS: true,
    VIEW_COMPLIANCE: true,
  },
  FLEET_MANAGER: {
    MANAGE_VEHICLES: true,
    VIEW_VEHICLES: true,
    MANAGE_DRIVERS: true,
    VIEW_DRIVERS: true,
    MANAGE_TRIPS: true,
    VIEW_TRIPS: true,
    MANAGE_MAINTENANCE: true,
    VIEW_MAINTENANCE: true,
    MANAGE_FUEL_EXPENSES: true,
    VIEW_FUEL_EXPENSES: true,
    VIEW_REPORTS: true,
    VIEW_COMPLIANCE: true,
  },
  DRIVER: {
    VIEW_VEHICLES: true,
    VIEW_DRIVERS: false,
    MANAGE_TRIPS: true, // Drivers can update their assigned trip statuses (dispatch/complete)
    VIEW_TRIPS: true,
    MANAGE_FUEL_EXPENSES: true, // Fuel logging for own trips
    VIEW_FUEL_EXPENSES: true,
    VIEW_MAINTENANCE: false,
    VIEW_REPORTS: false,
    VIEW_COMPLIANCE: false,
  },
  SAFETY_OFFICER: {
    VIEW_VEHICLES: true,
    MANAGE_DRIVERS: true, // Update compliance status/suspend
    VIEW_DRIVERS: true,
    VIEW_TRIPS: true,
    VIEW_MAINTENANCE: true,
    VIEW_FUEL_EXPENSES: false,
    VIEW_REPORTS: true, // Can see safety compliance reports
    VIEW_COMPLIANCE: true,
  },
  FINANCIAL_ANALYST: {
    VIEW_VEHICLES: true,
    VIEW_DRIVERS: true,
    VIEW_TRIPS: true,
    VIEW_MAINTENANCE: true,
    VIEW_FUEL_EXPENSES: true,
    VIEW_REPORTS: true, // Full reports access
    VIEW_COMPLIANCE: false,
  },
};

/**
 * Checks if a user role has the required permission for an action
 */
export function hasPermission(role: Role | undefined, action: ActionType): boolean {
  if (!role) return false;
  return !!PERMISSION_MATRIX[role]?.[action];
}

/**
 * Server-side helper to assert user role and throw an error if authorization fails
 */
export function assertPermission(role: Role | undefined, action: ActionType): void {
  if (!hasPermission(role, action)) {
    throw new Error("Forbidden: You do not have permission to perform this action.");
  }
}
