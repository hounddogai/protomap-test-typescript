import { FraudCheckException } from "../../fraud-check/policy/fraud-check-exception.js";
import { normalizeFraudCheckPolicyCode } from "../../fraud-check/policy/fraud-check-policy-policy.js";
import { WeightedTierRecord, newWeightedTierRecord } from "./weighted-tier-record.js";

export function summarizeFraudCheckExceptionsForRecord(items: FraudCheckException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedTierRecordsFromException(items: FraudCheckException[]): WeightedTierRecord[] {
  const out: WeightedTierRecord[] = [];
  for (const item of items) {
    const derived = newWeightedTierRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWeightedTierRecord(item: WeightedTierRecord): string {
  return normalizeFraudCheckPolicyCode(item.code);
}
