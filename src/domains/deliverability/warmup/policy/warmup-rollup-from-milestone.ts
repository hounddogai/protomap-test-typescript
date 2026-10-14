import { normalizeGlobalBounceSummaryCode } from "../../bounce/bounce-summary/global-bounce-summary-policy.js";
import { ScheduledBounceMilestone } from "../../bounce/bounce-summary/scheduled-bounce-milestone.js";
import { WarmupRollup, newWarmupRollup } from "./warmup-rollup.js";

export function summarizeScheduledBounceMilestonesForRollup(items: ScheduledBounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWarmupRollupsFromMilestone(items: ScheduledBounceMilestone[]): WarmupRollup[] {
  const out: WarmupRollup[] = [];
  for (const item of items) {
    const derived = newWarmupRollup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyWarmupRollup(item: WarmupRollup): string {
  return normalizeGlobalBounceSummaryCode(item.code);
}
