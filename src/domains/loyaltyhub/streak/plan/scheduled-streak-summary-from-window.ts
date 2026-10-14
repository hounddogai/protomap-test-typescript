import {
  classifyPrimaryRedemptionException,
} from "../../redemption/redemption-window/primary-redemption-exception-policy.js";
import { RollingRedemptionWindow } from "../../redemption/redemption-window/rolling-redemption-window.js";
import { ScheduledStreakSummary, newScheduledStreakSummary } from "./scheduled-streak-summary.js";

export function summarizeRollingRedemptionWindowsForSummary(items: RollingRedemptionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledStreakSummariesFromWindow(items: RollingRedemptionWindow[]): ScheduledStreakSummary[] {
  const out: ScheduledStreakSummary[] = [];
  for (const item of items) {
    const derived = newScheduledStreakSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceScheduledStreakSummary(item: ScheduledStreakSummary): string {
  return classifyPrimaryRedemptionException(item.measuredValue());
}
