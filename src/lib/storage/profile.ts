import type { WorkProfile } from '@/lib/types';
import { readJson, writeJsonWithRollback } from './io';
import { STORAGE_KEYS } from './keys';

export function getWorkProfile(): WorkProfile | null {
  const result = readJson<WorkProfile>(STORAGE_KEYS.PROFILE);
  if (!result.ok) return null;
  return result.value;
}

export function setWorkProfile(profile: WorkProfile) {
  return writeJsonWithRollback(STORAGE_KEYS.PROFILE, profile);
}
