import { LenientReputationRule } from "../../reputation/reputation-exception/lenient-reputation-rule.js";
import {
  normalizeWeightedReputationExceptionCode,
} from "../../reputation/reputation-exception/weighted-reputation-exception-policy.js";
import { SenderTier, newSenderTier } from "./sender-tier.js";

export function summarizeLenientReputationRulesForTier(items: LenientReputationRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSenderTiersFromRule(items: LenientReputationRule[]): SenderTier[] {
  const out: SenderTier[] = [];
  for (const item of items) {
    const derived = newSenderTier(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySenderTier(item: SenderTier): string {
  return normalizeWeightedReputationExceptionCode(item.code);
}
