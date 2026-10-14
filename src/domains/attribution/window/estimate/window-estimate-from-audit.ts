import { ScheduledWindowAudit } from "../rule/scheduled-window-audit.js";
import { classifyWeightedWindowRequest } from "../rule/weighted-window-request-policy.js";
import { WindowEstimate, newWindowEstimate } from "./window-estimate.js";

export function summarizeScheduledWindowAuditsForEstimate(items: ScheduledWindowAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWindowEstimatesFromAudit(items: ScheduledWindowAudit[]): WindowEstimate[] {
  const out: WindowEstimate[] = [];
  for (const item of items) {
    const derived = newWindowEstimate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectWindowEstimate(item: WindowEstimate): string {
  return classifyWeightedWindowRequest(item.netValue());
}
