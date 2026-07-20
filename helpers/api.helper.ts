import { APIRequestContext, APIResponse } from '@playwright/test';
import { logger } from '@utils/logger';
import { config } from '@utils/config';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  status: number;
  statusText: string;
  body: T;
  headers: Record<string, string>;
  ok: boolean;
}

export class ApiHelper {
  private request: APIRequestContext;
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseUrl = config.apiUrl;
    this.defaultTimeout = config.timeouts.api;
  }

  // ─── Core Methods ────────────────────────────────────────────

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, options);
  }

  /**
   * POST request
   */
  async post<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, options);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, options);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, options);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, options);
  }

  // ─── Convenience Methods ─────────────────────────────────────

  /**
   * Quick POST with JSON body — most common pattern
   */
  async postJson<T = unknown>(endpoint: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.post<T>(endpoint, { data: body, headers });
  }

  /**
   * Quick GET with auth token
   */
  async getAuth<T = unknown>(endpoint: string, token: string): Promise<ApiResponse<T>> {
    return this.get<T>(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async postAuth<T = unknown>(endpoint: string, token: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, {
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async putAuth<T = unknown>(endpoint: string, token: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.put<T>(endpoint, {
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async patchAuth<T = unknown>(endpoint: string, token: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.patch<T>(endpoint, {
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async deleteAuth<T = unknown>(endpoint: string, token: string): Promise<ApiResponse<T>> {
    return this.delete<T>(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Form-data POST (for file uploads, etc.)
   */
  async postForm<T = unknown>(endpoint: string, form: Record<string, string | Buffer>, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.post<T>(endpoint, {
      data: form,
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    });
  }

  // ─── Internal ────────────────────────────────────────────────

  /**
   * Central request handler — all methods go through here
   */
  private async makeRequest<T>(method: string, endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);
    const timeout = options?.timeout || this.defaultTimeout;

    logger.step(`API ${method} ${url}`);

    const response: APIResponse = await this.request.fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      data: options?.data,
      params: options?.params,
      timeout,
    });

    const body = await response.json().catch(() => null) as T;
    const result: ApiResponse<T> = {
      status: response.status(),
      statusText: response.statusText(),
      body,
      headers: response.headers(),
      ok: response.ok(),
    };

    if (response.ok()) {
      logger.info(`${method} ${endpoint} → ${response.status()}`);
    } else {
      logger.error(`${method} ${endpoint} → ${response.status()} ${response.statusText()}`, { body });
    }

    return result;
  }

  /**
   * Build full URL from endpoint + query params
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const base = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    if (!params) return base;

    const query = new URLSearchParams(params).toString();
    return query ? `${base}?${query}` : base;
  }
}