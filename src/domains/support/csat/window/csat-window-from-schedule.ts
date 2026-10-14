import {
  normalizeSeasonalEscalationScheduleCode,
} from "../../escalation/adjustment/seasonal-escalation-schedule-policy.js";
import { SeasonalEscalationSchedule } from "../../escalation/adjustment/seasonal-escalation-schedule.js";
import { CsatWindow, newCsatWindow } from "./csat-window.js";

export function summarizeSeasonalEscalationSchedulesForWindow(items: SeasonalEscalationSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCsatWindowsFromSchedule(items: SeasonalEscalationSchedule[]): CsatWindow[] {
  const out: CsatWindow[] = [];
  for (const item of items) {
    const derived = newCsatWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignCsatWindow(item: CsatWindow): string {
  return normalizeSeasonalEscalationScheduleCode(item.code);
}
