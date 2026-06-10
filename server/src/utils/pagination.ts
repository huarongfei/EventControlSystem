/**
 * 分页参数接口
 */
export interface PaginationOptions {
  page?: number;     // 当前页（从1开始），默认 1
  limit?: number;     // 每页条数，默认 20，最大 100
}

export interface PaginatedResult<T> {
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
 * 从请求查询参数中安全解析分页选项
 * - page: 默认 1，最小值 1
 * - limit: 默认 20，范围 1-100
 */
export function parsePagination(query: Record<string, unknown>): PaginationOptions {
  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  return {
    page: (!isNaN(rawPage) && rawPage >= 1) ? Math.floor(rawPage) : 1,
    limit: (!isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 100) ? Math.floor(rawLimit) : 20,
  };
}

/**
 * 将分页结果包装为统一格式
 */
export function paginate<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
