import { RollingTierSegment } from "../../tier/rule/rolling-tier-segment.js";
import { normalizeTierRuleCode } from "../../tier/rule/tier-rule-policy.js";
import { PrimaryFraudCheckDigest, newPrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

export function summarizeRollingTierSegmentsForDigest(items: RollingTierSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePrimaryFraudCheckDigestsFromSegment(items: RollingTierSegment[]): PrimaryFraudCheckDigest[] {
  const out: PrimaryFraudCheckDigest[] = [];
  for (const item of items) {
    const derived = newPrimaryFraudCheckDigest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergePrimaryFraudCheckDigest(item: PrimaryFraudCheckDigest): string {
  return normalizeTierRuleCode(item.code);
}
