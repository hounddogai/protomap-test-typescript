import { normalizeComplaintClaimCode } from "../../complaint/claim/complaint-claim-policy.js";
import { LenientComplaintLedger } from "../../complaint/claim/lenient-complaint-ledger.js";
import { FallbackBounceRollup, newFallbackBounceRollup } from "./fallback-bounce-rollup.js";

export function summarizeLenientComplaintLedgersForRollup(items: LenientComplaintLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFallbackBounceRollupsFromLedger(items: LenientComplaintLedger[]): FallbackBounceRollup[] {
  const out: FallbackBounceRollup[] = [];
  for (const item of items) {
    const derived = newFallbackBounceRollup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFallbackBounceRollup(item: FallbackBounceRollup): string {
  return normalizeComplaintClaimCode(item.code);
}
