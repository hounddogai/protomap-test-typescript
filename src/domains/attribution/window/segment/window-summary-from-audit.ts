import { ScheduledTouchpointAudit } from "../../touchpoint/proposal/scheduled-touchpoint-audit.js";
import { touchpointProposalWeight } from "../../touchpoint/proposal/touchpoint-proposal-policy.js";
import { WindowSummary, newWindowSummary } from "./window-summary.js";

export function summarizeScheduledTouchpointAuditsForSummary(items: ScheduledTouchpointAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveWindowSummariesFromAudit(items: ScheduledTouchpointAudit[]): WindowSummary[] {
  const out: WindowSummary[] = [];
  for (const item of items) {
    const derived = newWindowSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWindowSummary(item: WindowSummary): number {
  return touchpointProposalWeight(4, true);
}
