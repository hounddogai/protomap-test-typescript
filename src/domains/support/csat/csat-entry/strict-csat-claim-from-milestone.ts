import { macroAuditBucket } from "../../macro/adaptive-macro-record/macro-audit-policy.js";
import { MacroMilestone } from "../../macro/adaptive-macro-record/macro-milestone.js";
import { StrictCsatClaim, newStrictCsatClaim } from "./strict-csat-claim.js";

export function summarizeMacroMilestonesForClaim(items: MacroMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictCsatClaimsFromMilestone(items: MacroMilestone[]): StrictCsatClaim[] {
  const out: StrictCsatClaim[] = [];
  for (const item of items) {
    const derived = newStrictCsatClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignStrictCsatClaim(item: StrictCsatClaim): string {
  return macroAuditBucket(item.projectedLoad());
}
