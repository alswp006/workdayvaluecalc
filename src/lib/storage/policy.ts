import type { AppPolicyState } from '@/lib/types';
import { readJson } from './io';
import { STORAGE_KEYS } from './keys';

const DEFAULT_STATE: AppPolicyState = { version: 1, blockExternalNavigation: true };

export function getPolicyState(): AppPolicyState {
  const result = readJson<AppPolicyState>(STORAGE_KEYS.POLICY);
  if (!result.ok || result.value === null) return { ...DEFAULT_STATE };
  return result.value;
}
