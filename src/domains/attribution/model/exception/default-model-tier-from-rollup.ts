import { normalizeLenientPathRollupCode } from "../../path/path-quota/lenient-path-rollup-policy.js";
import { LenientPathRollup } from "../../path/path-quota/lenient-path-rollup.js";
import { DefaultModelTier, newDefaultModelTier } from "./default-model-tier.js";

export function summarizeLenientPathRollupsForTier(items: LenientPathRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDefaultModelTiersFromRollup(items: LenientPathRollup[]): DefaultModelTier[] {
  const out: DefaultModelTier[] = [];
  for (const item of items) {
    const derived = newDefaultModelTier(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectDefaultModelTier(item: DefaultModelTier): string {
  return normalizeLenientPathRollupCode(item.code);
}
