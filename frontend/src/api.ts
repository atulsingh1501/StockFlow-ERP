import type { ApiResult, ListResponse } from './types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
export const PAGE_SIZE = 6;

export async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
  const data = (await response.json().catch(() => ({}))) as ApiResult<T>;
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export function money(value: string | number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export { ListResponse };
