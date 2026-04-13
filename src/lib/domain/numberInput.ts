/** 숫자 문자열에 천 단위 쉼표 포맷 */
export function formatWithComma(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

/** 포맷된 문자열에서 숫자만 추출 */
export function parseFormatted(formatted: string): number {
  return Number(formatted.replace(/[^0-9]/g, '')) || 0;
}

/** 숫자를 한국식 단위 문자열로 변환 (예: 3000000 → "300만원") */
export function toKoreanUnit(n: number): string {
  if (!n || n <= 0) return '';
  const uk = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const won = n % 10_000;

  if (uk > 0 && man > 0) return `${uk}억 ${man}만원`;
  if (uk > 0) return `${uk}억원`;
  if (man > 0 && won > 0) return `${man}만 ${won.toLocaleString('ko-KR')}원`;
  if (man > 0) return `${man}만원`;
  return `${n.toLocaleString('ko-KR')}원`;
}

/** onChange 핸들러에서 포맷된 값 반환 */
export function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>): string {
  return formatWithComma(e.target.value);
}
