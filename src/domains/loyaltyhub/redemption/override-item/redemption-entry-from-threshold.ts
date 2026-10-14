import { DefaultChallengeThreshold } from "../../challenge/primary-challenge-override/default-challenge-threshold.js";
import {
  classifyTieredChallengeAudit,
} from "../../challenge/primary-challenge-override/tiered-challenge-audit-policy.js";
import { RedemptionEntry, newRedemptionEntry } from "./redemption-entry.js";

export function summarizeDefaultChallengeThresholdsForEntry(items: DefaultChallengeThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRedemptionEntriesFromThreshold(items: DefaultChallengeThreshold[]): RedemptionEntry[] {
  const out: RedemptionEntry[] = [];
  for (const item of items) {
    const derived = newRedemptionEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRedemptionEntry(item: RedemptionEntry): string {
  return classifyTieredChallengeAudit(item.projectedTotal());
}
