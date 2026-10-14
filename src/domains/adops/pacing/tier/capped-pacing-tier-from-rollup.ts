import { classifyLenientCreativeLedger } from "../../creative/creative-ledger/lenient-creative-ledger-policy.js";
import { LenientCreativeRollup } from "../../creative/creative-ledger/lenient-creative-rollup.js";
import { CappedPacingTier, newCappedPacingTier } from "./capped-pacing-tier.js";

export function summarizeLenientCreativeRollupsForTier(items: LenientCreativeRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCappedPacingTiersFromRollup(items: LenientCreativeRollup[]): CappedPacingTier[] {
  const out: CappedPacingTier[] = [];
  for (const item of items) {
    const derived = newCappedPacingTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeCappedPacingTier(item: CappedPacingTier): string {
  return classifyLenientCreativeLedger(item.netTotal());
}
