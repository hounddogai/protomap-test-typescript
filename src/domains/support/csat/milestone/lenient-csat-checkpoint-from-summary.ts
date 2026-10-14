import { pendingMacroClaimWeight } from "../../macro/macro-claim/pending-macro-claim-policy.js";
import { ScheduledMacroSummary } from "../../macro/macro-claim/scheduled-macro-summary.js";
import { LenientCsatCheckpoint, newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

export function summarizeScheduledMacroSummariesForCheckpoint(items: ScheduledMacroSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveLenientCsatCheckpointsFromSummary(items: ScheduledMacroSummary[]): LenientCsatCheckpoint[] {
  const out: LenientCsatCheckpoint[] = [];
  for (const item of items) {
    const derived = newLenientCsatCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveLenientCsatCheckpoint(item: LenientCsatCheckpoint): number {
  return pendingMacroClaimWeight(9, true);
}
