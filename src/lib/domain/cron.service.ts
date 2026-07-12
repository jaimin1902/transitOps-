import { prisma } from "../prisma";

export async function checkDriverLicenseExpirations() {
  const now = new Date();
  const warningThreshold = new Date();
  warningThreshold.setDate(now.getDate() + 30); // 30 days warning window

  const drivers = await prisma.driver.findMany({
    where: {
      licenseExpiryDate: {
        lte: warningThreshold,
      },
    },
  });

  let alertsLogged = 0;

  for (const d of drivers) {
    const expiry = new Date(d.licenseExpiryDate);
    
    // Check if alert was already logged to prevent duplicates
    const existingNotification = await prisma.notificationLog.findFirst({
      where: {
        type: "DRIVER_LICENSE_EXPIRY",
        referenceId: d.id,
      },
    });

    if (!existingNotification) {
      // Log to NotificationLog
      await prisma.notificationLog.create({
        data: {
          type: "DRIVER_LICENSE_EXPIRY",
          referenceId: d.id,
          sentAt: new Date(),
        },
      });

      // Log to AuditLog
      await prisma.auditLog.create({
        data: {
          userId: "SYSTEM_SCHEDULER",
          action: expiry < now ? "DRIVER_LICENSE_EXPIRED" : "DRIVER_LICENSE_EXPIRING_WARN",
          entityType: "DRIVER",
          entityId: d.id,
        },
      });

      alertsLogged++;
    }
  }

  return alertsLogged;
}

export async function checkVehicleDocumentExpirations() {
  const now = new Date();
  const warningThreshold = new Date();
  warningThreshold.setDate(now.getDate() + 30); // 30 days warning window

  // Fetch all vehicle documents with an expiryDate
  const documents = await prisma.vehicleDocument.findMany({
    where: {
      expiryDate: {
        not: null,
      },
    },
    include: {
      vehicle: { select: { registrationNumber: true } },
    },
  });

  let alertsLogged = 0;

  for (const doc of documents) {
    if (!doc.expiryDate) continue;

    const expiry = new Date(doc.expiryDate);
    const isExpiredOrExpiring = expiry <= warningThreshold;

    if (isExpiredOrExpiring) {
      // Check if alert was already logged to prevent duplicates
      const existingNotification = await prisma.notificationLog.findFirst({
        where: {
          type: "VEHICLE_DOC_EXPIRY",
          referenceId: doc.id,
        },
      });

      if (!existingNotification) {
        // Log to NotificationLog
        await prisma.notificationLog.create({
          data: {
            type: "VEHICLE_DOC_EXPIRY",
            referenceId: doc.id,
            sentAt: new Date(),
          },
        });

        // Log to AuditLog (using a system user id or a designated mock id)
        await prisma.auditLog.create({
          data: {
            userId: "SYSTEM_SCHEDULER",
            action: expiry < now ? "DOCUMENT_EXPIRED" : "DOCUMENT_EXPIRING_WARN",
            entityType: "VEHICLE_DOCUMENT",
            entityId: doc.id,
          },
        });

        alertsLogged++;
      }
    }
  }

  return alertsLogged;
}

export async function runCronChecks() {
  // Execute both driver licensing and vehicle compliance document audits
  const [driverAlerts, documentAlerts] = await Promise.all([
    checkDriverLicenseExpirations(),
    checkVehicleDocumentExpirations(),
  ]);

  return {
    driverAlerts,
    documentAlerts,
    totalAlertsLogged: driverAlerts + documentAlerts,
  };
}
