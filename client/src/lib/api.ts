import { queryClient } from "./queryClient";

interface ApiError extends Error {
  status?: number;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      const error: ApiError = new Error(text || res.statusText);
      error.status = res.status;
      
      // If we get a 401 Unauthorized, clear the query cache
      if (res.status === 401) {
        queryClient.clear();
      }
      
      throw error;
    }

    return res;
  } catch (error) {
    throw error;
  }
}

export async function fetchById<T>(endpoint: string, id: string | number): Promise<T> {
  const response = await apiRequest("GET", `${endpoint}/${id}`);
  return response.json();
}

export async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const response = await apiRequest("GET", endpoint);
  return response.json();
}

export async function createItem<T>(endpoint: string, data: any): Promise<T> {
  const response = await apiRequest("POST", endpoint, data);
  return response.json();
}

export async function updateItem<T>(endpoint: string, id: string | number, data: any): Promise<T> {
  const response = await apiRequest("PUT", `${endpoint}/${id}`, data);
  return response.json();
}

export async function deleteItem(endpoint: string, id: string | number): Promise<void> {
  await apiRequest("DELETE", `${endpoint}/${id}`);
}
