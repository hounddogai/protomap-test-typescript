import { SuppressionProposal } from "../../suppression/proposal/suppression-proposal.js";
import { normalizeSuppressionRecordCode } from "../../suppression/proposal/suppression-record-policy.js";
import { PendingProofAudit, newPendingProofAudit } from "./pending-proof-audit.js";

export function summarizeSuppressionProposalsForAudit(items: SuppressionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePendingProofAuditsFromProposal(items: SuppressionProposal[]): PendingProofAudit[] {
  const out: PendingProofAudit[] = [];
  for (const item of items) {
    const derived = newPendingProofAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingProofAudit(item: PendingProofAudit): string {
  return normalizeSuppressionRecordCode(item.code);
}
