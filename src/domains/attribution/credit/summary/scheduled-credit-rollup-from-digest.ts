import { normalizePrimaryPathRecordCode } from "../../path/path-record/primary-path-record-policy.js";
import { TieredPathDigest } from "../../path/path-record/tiered-path-digest.js";
import { ScheduledCreditRollup, newScheduledCreditRollup } from "./scheduled-credit-rollup.js";

export function summarizeTieredPathDigestsForRollup(items: TieredPathDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveScheduledCreditRollupsFromDigest(items: TieredPathDigest[]): ScheduledCreditRollup[] {
  const out: ScheduledCreditRollup[] = [];
  for (const item of items) {
    const derived = newScheduledCreditRollup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitScheduledCreditRollup(item: ScheduledCreditRollup): string {
  return normalizePrimaryPathRecordCode(item.code);
}
