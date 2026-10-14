import { ProofVariance } from "../window/proof-variance.js";
import { proofWindowBucket } from "../window/proof-window-policy.js";
import { PendingProofAudit, newPendingProofAudit } from "./pending-proof-audit.js";

export function summarizeProofVariancesForAudit(items: ProofVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePendingProofAuditsFromVariance(items: ProofVariance[]): PendingProofAudit[] {
  const out: PendingProofAudit[] = [];
  for (const item of items) {
    const derived = newPendingProofAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitPendingProofAudit(item: PendingProofAudit): string {
  return proofWindowBucket(item.adjustedValue());
}
