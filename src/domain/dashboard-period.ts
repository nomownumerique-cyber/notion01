import { addDays, isoDate, parseDate } from './calendar.ts';
import { validReportRange } from './content-report.ts';

export function dashboardPeriod(start: string, end: string) {
  if (!validReportRange(start, end) || start < '1901-01-01' || end > '2098-12-31') return null;
  const from = parseDate(start)!, to = parseDate(end)!;
  const length = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
  return { start, end, previousStart: isoDate(addDays(from, -length)), previousEnd: isoDate(addDays(from, -1)) };
}
export function defaultDashboardPeriod(now: Date) {
  const today = parseDate(isoDate(now))!;
  return dashboardPeriod(isoDate(addDays(today, -29)), isoDate(today))!;
}
