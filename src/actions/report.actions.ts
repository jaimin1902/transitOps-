"use server";

import { auth } from "@/lib/auth";
import { assertPermission } from "@/lib/rbac";
import {
  getTripsReport,
  getMaintenanceReport,
  getExpensesReport,
  getFuelReport,
  DateFilter,
} from "@/lib/domain/report.service";

export async function getReportDataAction(
  reportType: "trips" | "maintenance" | "expenses" | "fuel",
  filter: { startDate?: string; endDate?: string } = {}
) {
  const session = await auth();

  try {
    // RBAC Security Check
    assertPermission(session?.user?.role, "VIEW_REPORTS");

    const dateFilter: DateFilter = {};
    if (filter.startDate) dateFilter.startDate = new Date(filter.startDate);
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.endDate = end;
    }

    let data: unknown[] = [];
    if (reportType === "trips") {
      data = await getTripsReport(dateFilter);
    } else if (reportType === "maintenance") {
      data = await getMaintenanceReport(dateFilter);
    } else if (reportType === "expenses") {
      data = await getExpensesReport(dateFilter);
    } else if (reportType === "fuel") {
      data = await getFuelReport(dateFilter);
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Action error fetching reports:", error);
    const message = error instanceof Error ? error.message : "Failed to load report data.";
    return { success: false, error: message };
  }
}
