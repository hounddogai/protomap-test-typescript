import { csatClaimWeight } from "../../csat/schedule/csat-claim-policy.js";
import { CsatMilestone } from "../../csat/schedule/csat-milestone.js";
import { SlaTarget, newSlaTarget } from "./sla-target.js";

export function summarizeCsatMilestonesForTarget(items: CsatMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSlaTargetsFromMilestone(items: CsatMilestone[]): SlaTarget[] {
  const out: SlaTarget[] = [];
  for (const item of items) {
    const derived = newSlaTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSlaTarget(item: SlaTarget): number {
  return csatClaimWeight(6, true);
}
