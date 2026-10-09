export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 10000;

    if (
      !this.baseUrl.startsWith('https://') &&
      !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(this.baseUrl)
    ) {
      console.error(
        `Warning: connecting to Kei over unencrypted HTTP (${this.baseUrl}). ` +
        'Your API key will be sent in plain text. Use HTTPS in production.'
      );
    }
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return this.request<T>(url.toString(), { method: 'GET' });
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(`${this.baseUrl}${path}`, { method: 'DELETE' });
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new ApiError(401, 'Unauthorized: invalid or expired API key');
      }
      if (response.status === 403) {
        throw new ApiError(403, 'Forbidden: you don\'t have permission for this action');
      }
      if (response.status === 404) {
        throw new ApiError(404, 'Not found');
      }
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(422, `Validation failed: ${JSON.stringify(errorData)}`);
      }
      if (!response.ok) {
        throw new ApiError(response.status, `API error: ${response.status} ${response.statusText}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, 'Request timeout');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, `Cannot connect to Kei API at ${this.baseUrl}`);
      }
      throw new ApiError(0, `Request failed: ${(error as Error).message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
