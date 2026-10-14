import { AdaptiveOptOutAdjustment } from "../../opt-out/request/adaptive-opt-out-adjustment.js";
import { classifyCappedOptOutRequest } from "../../opt-out/request/capped-opt-out-request-policy.js";
import { CappedProofAgreement, newCappedProofAgreement } from "./capped-proof-agreement.js";

export function summarizeAdaptiveOptOutAdjustmentsForAgreement(items: AdaptiveOptOutAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveCappedProofAgreementsFromAdjustment(items: AdaptiveOptOutAdjustment[]): CappedProofAgreement[] {
  const out: CappedProofAgreement[] = [];
  for (const item of items) {
    const derived = newCappedProofAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCappedProofAgreement(item: CappedProofAgreement): string {
  return classifyCappedOptOutRequest(item.weightedTotal());
}
