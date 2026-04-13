import type { FixedExpense, FixedExpenseStore } from '@/lib/types';
import { readJson, writeJsonWithRollback } from './io';
import { STORAGE_KEYS } from './keys';

const DEFAULT_STORE: FixedExpenseStore = { version: 1, items: [] };

type GetFixedExpenseStoreResult =
  | FixedExpenseStore
  | { ok: false; error: { type: 'PARSE_ERROR'; key: string } };

export function getFixedExpenseStore(): GetFixedExpenseStoreResult {
  const result = readJson<FixedExpenseStore>(STORAGE_KEYS.FIXED_EXPENSES);
  if (!result.ok) return result;
  if (result.value === null) return { ...DEFAULT_STORE };
  return result.value;
}

export function addFixedExpense(item: Omit<FixedExpense, 'id' | 'createdAt'>) {
  const current = getFixedExpenseStore();
  const items = 'ok' in current ? [] : current.items;

  const newItem: FixedExpense = {
    ...item,
    id: `fe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };

  return writeJsonWithRollback(STORAGE_KEYS.FIXED_EXPENSES, {
    version: 1,
    items: [...items, newItem],
  });
}
