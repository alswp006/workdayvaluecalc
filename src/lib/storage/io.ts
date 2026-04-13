type ReadJsonResult<T> =
  | { ok: true; value: T | null }
  | { ok: false; error: { type: 'PARSE_ERROR'; key: string } };

type WriteJsonResult =
  | { ok: true }
  | { ok: false; error: { type: 'QUOTA_EXCEEDED'; key: string } };

export function readJson<T>(key: string): ReadJsonResult<T> {
  const raw = localStorage.getItem(key);
  if (raw === null) return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false, error: { type: 'PARSE_ERROR', key } };
  }
}

export function writeJsonWithRollback<T>(key: string, nextValue: T): WriteJsonResult {
  const prev = localStorage.getItem(key);
  try {
    localStorage.setItem(key, JSON.stringify(nextValue));
    return { ok: true };
  } catch {
    // 실패 시 이전 값으로 롤백
    if (prev === null) {
      localStorage.removeItem(key);
    } else {
      // setItem이 실패한 상황이므로 removeItem/재설정도 실패할 수 있지만
      // 대부분의 브라우저에서 기존 키 덮어쓰기가 아닌 새 키 추가 시 Quota가 발생하므로
      // 기존 값은 변경되지 않은 상태다. 방어적으로 복원 시도.
      try { localStorage.setItem(key, prev); } catch { /* ignore */ }
    }
    return { ok: false, error: { type: 'QUOTA_EXCEEDED', key } };
  }
}
