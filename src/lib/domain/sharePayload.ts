import type { CalcRecord } from '@/lib/types';

type DecodeResult =
  | { ok: true; value: CalcRecord }
  | { ok: false };

export function encodeSharePayload(record: CalcRecord): string {
  return btoa(encodeURIComponent(JSON.stringify(record)));
}

export function decodeSharePayload(input: string): DecodeResult {
  try {
    if (!input) return { ok: false };
    const json = decodeURIComponent(atob(input));
    const value = JSON.parse(json) as CalcRecord;
    if (!value.id || !value.createdAt) return { ok: false };
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}
