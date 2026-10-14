import { classifyGlobalProofMapping } from "../../proof/mapping/global-proof-mapping-policy.js";
import { ProofThreshold } from "../../proof/mapping/proof-threshold.js";
import { FallbackOptOutAgreement, newFallbackOptOutAgreement } from "./fallback-opt-out-agreement.js";

export function summarizeProofThresholdsForAgreement(items: ProofThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFallbackOptOutAgreementsFromThreshold(items: ProofThreshold[]): FallbackOptOutAgreement[] {
  const out: FallbackOptOutAgreement[] = [];
  for (const item of items) {
    const derived = newFallbackOptOutAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileFallbackOptOutAgreement(item: FallbackOptOutAgreement): string {
  return classifyGlobalProofMapping(item.adjustedVolume());
}
