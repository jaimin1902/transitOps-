import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/expiry-check
 * Vercel Cron (or any scheduler) triggers this daily.
 * Checks driver license expiries and vehicle document expiries,
 * logs to NotificationLog (skips if already logged today).
 */
export async function GET(request: Request) {
  // Security: Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const results = {
    driverLicenseAlerts: 0,
    documentExpiryAlerts: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    // === 1. Driver License Expiry Check ===
    const expiringDrivers = await prisma.driver.findMany({
      where: {
        licenseExpiryDate: {
          lte: thirtyDaysFromNow,
        },
        status: { not: "SUSPENDED" },
      },
      select: { id: true, name: true, licenseExpiryDate: true },
    });

    for (const driver of expiringDrivers) {
      // Check if we already sent a notification today
      const existing = await prisma.notificationLog.findFirst({
        where: {
          type: "DRIVER_LICENSE_EXPIRY",
          referenceId: driver.id,
          sentAt: { gte: todayStart },
        },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.notificationLog.create({
        data: {
          type: "DRIVER_LICENSE_EXPIRY",
          referenceId: driver.id,
        },
      });

      results.driverLicenseAlerts++;
      console.log(
        `[CRON] License expiry alert logged for driver ${driver.name} — expires ${driver.licenseExpiryDate.toISOString()}`
      );
    }

    // === 2. Vehicle Document Expiry Check ===
    const expiringDocs = await prisma.vehicleDocument.findMany({
      where: {
        expiryDate: {
          not: null,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        vehicle: { select: { registrationNumber: true } },
      },
    });

    for (const doc of expiringDocs) {
      const existing = await prisma.notificationLog.findFirst({
        where: {
          type: "VEHICLE_DOC_EXPIRY",
          referenceId: doc.id,
          sentAt: { gte: todayStart },
        },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.notificationLog.create({
        data: {
          type: "VEHICLE_DOC_EXPIRY",
          referenceId: doc.id,
        },
      });

      results.documentExpiryAlerts++;
      console.log(
        `[CRON] Document expiry alert logged for ${doc.vehicle.registrationNumber} — ${doc.type} expires ${doc.expiryDate?.toISOString()}`
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("[CRON] expiry-check failed:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed. See server logs." },
      { status: 500 }
    );
  }
}
