import type { CalcRecord, CalcRecordStore } from '@/lib/types';
import { readJson, writeJsonWithRollback } from './io';
import { STORAGE_KEYS } from './keys';

const MAX_ITEMS = 100;
const DEFAULT_STORE: CalcRecordStore = { version: 1, items: [] };

type GetCalcStoreResult =
  | CalcRecordStore
  | { ok: false; error: { type: 'PARSE_ERROR'; key: string } };

export function getCalcStore(): GetCalcStoreResult {
  const result = readJson<CalcRecordStore>(STORAGE_KEYS.CALCS);
  if (!result.ok) return result;
  if (result.value === null) return { ...DEFAULT_STORE };
  return result.value;
}

export function resetCalcStore() {
  return writeJsonWithRollback(STORAGE_KEYS.CALCS, { ...DEFAULT_STORE });
}

export function addCalcRecord(record: CalcRecord) {
  const current = getCalcStore();
  const items = 'ok' in current ? [] : current.items;

  const next = [record, ...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ITEMS);

  return writeJsonWithRollback(STORAGE_KEYS.CALCS, { version: 1, items: next });
}
