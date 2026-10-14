import { normalizeCsatRequestCode } from "../../csat/request/csat-request-policy.js";
import { LegacyCsatMilestone } from "../../csat/request/legacy-csat-milestone.js";
import { SlaTier, newSlaTier } from "./sla-tier.js";

export function summarizeLegacyCsatMilestonesForTier(items: LegacyCsatMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSlaTiersFromMilestone(items: LegacyCsatMilestone[]): SlaTier[] {
  const out: SlaTier[] = [];
  for (const item of items) {
    const derived = newSlaTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSlaTier(item: SlaTier): string {
  return normalizeCsatRequestCode(item.code);
}
