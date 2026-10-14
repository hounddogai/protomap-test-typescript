import { WaitForecast } from "../../wait/milestone/wait-forecast.js";
import { classifyWaitMilestone } from "../../wait/milestone/wait-milestone-policy.js";
import { GlobalEnrollmentSlot, newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

export function summarizeWaitForecastsForSlot(items: WaitForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalEnrollmentSlotsFromForecast(items: WaitForecast[]): GlobalEnrollmentSlot[] {
  const out: GlobalEnrollmentSlot[] = [];
  for (const item of items) {
    const derived = newGlobalEnrollmentSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchGlobalEnrollmentSlot(item: GlobalEnrollmentSlot): string {
  return classifyWaitMilestone(item.adjustedTotal());
}
