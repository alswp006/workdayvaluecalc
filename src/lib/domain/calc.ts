import type { WorkProfileSnapshot } from '@/lib/types';

const WEEKS_PER_MONTH = 52 / 12;

export function computeHourlyWageKRW(profile: WorkProfileSnapshot): number {
  const effectiveHours = profile.includeLunchBreak
    ? Math.max(profile.workHoursPerDay - 1, 1)
    : profile.workHoursPerDay;

  let monthlyPay: number;
  if (profile.payType === 'annual') {
    monthlyPay = profile.payAmount / 12;
  } else if (profile.payType === 'hourly') {
    return Math.max(1, Math.round(profile.payAmount));
  } else {
    monthlyPay = profile.payAmount;
  }

  const hoursPerMonth = profile.workDaysPerWeek * WEEKS_PER_MONTH * effectiveHours;
  return Math.max(1, Math.round(monthlyPay / hoursPerMonth));
}

export function computeDerived(
  amountKRW: number,
  profileSnapshot: WorkProfileSnapshot,
): { hourlyWageKRW: number; minutesNeeded: number; secondsNeeded: number } {
  const hourlyWageKRW = computeHourlyWageKRW(profileSnapshot);
  const minutesNeeded = (amountKRW * 60) / hourlyWageKRW;
  const secondsNeeded = (amountKRW * 3600) / hourlyWageKRW;
  return { hourlyWageKRW, minutesNeeded, secondsNeeded };
}
