import { Sample, SampleStatus } from '../types';

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.details?.[0]?.message ?? body?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  list: (studyId?: string) =>
    http<{ items: Sample[]; total: number }>(`/api/samples${studyId ? `?studyId=${encodeURIComponent(studyId)}` : ''}`),
  create: (input: { code: string; studyId: string; type: string }) =>
    http<Sample>('/api/samples', { method: 'POST', body: JSON.stringify(input) }),
  advance: (id: string, status: SampleStatus) =>
    http<Sample>(`/api/samples/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export type Api = typeof api;
