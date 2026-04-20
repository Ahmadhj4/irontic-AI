// ─────────────────────────────────────────────
//  Base API client
// ─────────────────────────────────────────────
import { ApiResponse, ApiError, PagedParams } from '@/types';

const API_BASE = '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const error: ApiError = await res.json().catch(() => ({
          code: String(res.status),
          message: res.statusText,
        }));
        throw error;
      }
      return res.json();
    } catch (err) {
      if ((err as ApiError).code) throw err;
      throw { code: 'NETWORK_ERROR', message: 'Network request failed' } as ApiError;
    }
  }

  get<T>(path: string, params?: PagedParams) {
    const query = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<T>(`${path}${query}`);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE);
