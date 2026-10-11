/**
 * HTTP API client for PennyPilot expense tracker
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let errorData: any = null;
    try {
      errorData = await response.json();
      if (errorData && errorData.error) {
        if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (typeof errorData.error === "object" && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      }
    } catch {
      // Body not JSON
    }
    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
