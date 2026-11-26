const DAY = 86400000;
export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  if (year < 1900 || year > 2099) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
export function isoDate(date: Date): string { return date.toISOString().slice(0, 10); }
export function addDays(date: Date, n: number): Date { return new Date(date.getTime() + n * DAY); }
export function calendarRange(anchor: Date, mode: 'month' | 'week') {
  const first = mode === 'month' ? new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)) : anchor;
  const start = addDays(first, -(first.getUTCDay() + 6) % 7);
  const last = mode === 'month' ? new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)) : addDays(start, 6);
  const end = mode === 'month' ? addDays(last, (7 - (last.getUTCDay() + 6) % 7 - 1)) : last;
  const dates: string[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) dates.push(isoDate(day));
  return { start: isoDate(start), end: isoDate(end), dates };
}
export function shiftAnchor(anchor: Date, mode: 'month' | 'week', direction: -1 | 1): Date {
  return mode === 'week' ? addDays(anchor, direction * 7) : new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + direction, 1));
}
