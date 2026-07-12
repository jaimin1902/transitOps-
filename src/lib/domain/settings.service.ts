import { prisma } from "../prisma";
import { Role } from "@prisma/client";

export class SettingsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsServiceError";
  }
}

/**
 * Get system-wide settings. If not present, creates a default one.
 */
export async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        depotName: "TransitOps Depot",
        currency: "USD",
        distanceUnit: "km",
      },
    });
  }
  return settings;
}

/**
 * Update system settings
 */
export async function updateSettings(data: { depotName: string; currency: string; distanceUnit: string }) {
  const current = await getSettings();
  return prisma.settings.update({
    where: { id: current.id },
    data,
  });
}

/**
 * Get all role permissions
 */
export async function getRolePermissions() {
  return prisma.rolePermission.findMany({
    orderBy: [{ role: "asc" }, { module: "asc" }],
  });
}

/**
 * Update a specific role permission access level
 */
export async function updateRolePermission(role: Role, module: string, access: string) {
  if (!["none", "view", "edit"].includes(access)) {
    throw new SettingsServiceError("Invalid access level. Must be 'none', 'view', or 'edit'.");
  }

  return prisma.rolePermission.upsert({
    where: {
      role_module: { role, module },
    },
    update: { access },
    create: { role, module, access },
  });
}

/**
 * Check permission dynamically against the DB RolePermission matrix
 */
export async function checkDbPermission(role: Role | undefined, module: string, requiredAccess: "view" | "edit"): Promise<boolean> {
  if (!role) return false;
  if (role === Role.ADMIN) return true; // Admins override all checks

  const perm = await prisma.rolePermission.findUnique({
    where: {
      role_module: { role, module },
    },
  });

  if (!perm) return false;

  if (requiredAccess === "edit") {
    return perm.access === "edit";
  }

  // If view is required, both "view" and "edit" satisfy it
  return perm.access === "view" || perm.access === "edit";
}
