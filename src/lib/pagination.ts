// ─── Pagination Helpers ────────────────────────────────────────

export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
    total: number,
    page: number,
    limit: number
): PaginatedResponse<any>["pagination"] {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

/**
 * Calculate offset for database query
 */
export function calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: any): PaginationOptions {
    const page = Math.max(1, parseInt(params.page || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || "15") || 15));
    const sortBy = params.sortBy || "sentAt";
    const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

    return { page, limit, sortBy, sortOrder };
}
