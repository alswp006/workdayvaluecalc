import type { AiNoticeState } from '@/lib/types';
import { readJson, writeJsonWithRollback } from './io';
import { STORAGE_KEYS } from './keys';

const DEFAULT_STATE: AiNoticeState = { version: 1, scanAiNoticeAcknowledged: false };

export function getAiNoticeState(): AiNoticeState {
  const result = readJson<AiNoticeState>(STORAGE_KEYS.AI_NOTICE);
  if (!result.ok || result.value === null) return { ...DEFAULT_STATE };
  return result.value;
}

export function ackScanAiNotice() {
  const current = getAiNoticeState();
  return writeJsonWithRollback(STORAGE_KEYS.AI_NOTICE, {
    ...current,
    scanAiNoticeAcknowledged: true,
    acknowledgedAt: Date.now(),
  });
}
