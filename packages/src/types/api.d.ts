export type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data: T
  error?: string
}

export type Pagination<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type PaginatedApiResponse<T> = ApiResponse<Pagination<T>>
