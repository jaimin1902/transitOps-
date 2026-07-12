"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getTripById,
  TripServiceError,
} from "@/lib/domain/trip.service";
import { CreateTripInput, DispatchTripInput, CompleteTripInput } from "@/lib/validations/trip";
import { revalidatePath } from "next/cache";

export async function createTripAction(input: CreateTripInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_TRIPS");
    if (session?.user?.role === "DISPATCHER") {
      return { success: false, error: "Dispatchers cannot register new trips directly — use the Trip Wizard." };
    }

    const trip = await createTrip(session?.user?.id || "", input);
    revalidatePath("/trips");
    return { success: true, data: trip };
  } catch (error: unknown) {
    console.error("Action error creating trip:", error);
    if (error instanceof TripServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to create trip.";
    return { success: false, error: message };
  }
}

export async function dispatchTripAction(tripId: string, input: DispatchTripInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_TRIPS");

    const trip = await getTripById(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found." };
    }

    // Row level verification for Drivers starting dispatches
    if (session?.user?.role === "DISPATCHER" && session.user.driverId !== trip.driverId) {
      return { success: false, error: "Access denied: You are not assigned to this trip." };
    }

    const updatedTrip = await dispatchTrip(tripId, session?.user?.id || "", input);
    revalidatePath("/trips");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
    return { success: true, data: updatedTrip };
  } catch (error: unknown) {
    console.error(`Action error dispatching trip ${tripId}:`, error);
    if (error instanceof TripServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to dispatch trip.";
    return { success: false, error: message };
  }
}

export async function completeTripAction(tripId: string, input: CompleteTripInput) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_TRIPS");

    const trip = await getTripById(tripId);
    if (!trip) {
      return { success: false, error: "Trip not found." };
    }

    // Row level verification for Drivers completing dispatches
    if (session?.user?.role === "DISPATCHER" && session.user.driverId !== trip.driverId) {
      return { success: false, error: "Access denied: You are not assigned to this trip." };
    }

    const updatedTrip = await completeTrip(tripId, session?.user?.id || "", input);
    revalidatePath("/trips");
    revalidatePath("/vehicles");
    revalidatePath("/drivers");
    revalidatePath(`/vehicles/${trip.vehicleId}`);
    return { success: true, data: updatedTrip };
  } catch (error: unknown) {
    console.error(`Action error completing trip ${tripId}:`, error);
    if (error instanceof TripServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to complete trip.";
    return { success: false, error: message };
  }
}

export async function cancelTripAction(tripId: string) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "MANAGE_TRIPS");
    if (session?.user?.role === "DISPATCHER") {
      return { success: false, error: "Dispatchers cannot cancel trips." };
    }

    const updatedTrip = await cancelTrip(tripId, session?.user?.id || "");
    revalidatePath("/trips");
    return { success: true, data: updatedTrip };
  } catch (error: unknown) {
    console.error(`Action error cancelling trip ${tripId}:`, error);
    if (error instanceof TripServiceError) {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to cancel trip.";
    return { success: false, error: message };
  }
}
