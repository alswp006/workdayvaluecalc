import type { SavingsGoalState } from '@/lib/types';
import { readJson, writeJsonWithRollback } from './io';
import { STORAGE_KEYS } from './keys';

const DEFAULT_STATE: SavingsGoalState = { version: 1, goalAmountKRW: 0, monthlySavingsKRW: 0 };

export function getSavingsGoalState(): SavingsGoalState {
  const result = readJson<SavingsGoalState>(STORAGE_KEYS.SAVINGS_GOAL);
  if (!result.ok || result.value === null) return { ...DEFAULT_STATE };
  return result.value;
}

export function setSavingsGoalState(state: SavingsGoalState) {
  return writeJsonWithRollback(STORAGE_KEYS.SAVINGS_GOAL, state);
}
