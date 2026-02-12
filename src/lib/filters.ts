// ─── Filtering Helpers ──────────────────────────────────────────

import { eq, like, or, and, gte, lte, desc } from "drizzle-orm";

export interface NotificationFilters {
    channelId?: number;
    status?: "sent" | "failed" | "all";
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    sortBy?: "sentAt" | "title" | "status";
    sortOrder?: "asc" | "desc";
}

/**
 * Build WHERE clause for notification filters
 */
export function buildNotificationWhereClause(filters: NotificationFilters, notifications: any) {
    const conditions = [];

    if (filters.channelId) {
        conditions.push(eq(notifications.channelId, filters.channelId));
    }

    if (filters.status && filters.status !== "all") {
        conditions.push(eq(notifications.status, filters.status));
    }

    if (filters.dateFrom) {
        conditions.push(gte(notifications.sentAt, filters.dateFrom));
    }

    if (filters.dateTo) {
        conditions.push(lte(notifications.sentAt, filters.dateTo));
    }

    if (filters.search) {
        conditions.push(
            or(
                like(notifications.title, `%${filters.search}%`),
                like(notifications.body, `%${filters.search}%`)
            )
        );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Build ORDER BY clause for sorting
 */
export function buildOrderByClause(sortBy: string, sortOrder: "asc" | "desc", notifications: any) {
    const column = notifications[sortBy as keyof typeof notifications] || notifications.sentAt;
    return sortOrder === "asc" ? column : desc(column);
}

/**
 * Validate filter parameters
 */
export function validateFilterParams(params: any): NotificationFilters {
    const filters: NotificationFilters = {};

    if (params.channelId) {
        const channelId = parseInt(params.channelId);
        if (!isNaN(channelId)) {
            filters.channelId = channelId;
        }
    }

    if (params.status && ["sent", "failed", "all"].includes(params.status)) {
        filters.status = params.status;
    }

    if (params.dateFrom) {
        const dateFrom = new Date(params.dateFrom);
        if (!isNaN(dateFrom.getTime())) {
            filters.dateFrom = dateFrom;
        }
    }

    if (params.dateTo) {
        const dateTo = new Date(params.dateTo);
        if (!isNaN(dateTo.getTime())) {
            filters.dateTo = dateTo;
        }
    }

    if (params.search) {
        filters.search = params.search.trim();
    }

    filters.sortBy = params.sortBy || "sentAt";
    filters.sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

    return filters;
}
