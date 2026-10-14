import { batchedQueueProposalWeight } from "../../queue/proposal/batched-queue-proposal-policy.js";
import { GlobalQueueAgreement } from "../../queue/proposal/global-queue-agreement.js";
import { PrimaryApprovalSnapshot, newPrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

export function summarizeGlobalQueueAgreementsForSnapshot(items: GlobalQueueAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePrimaryApprovalSnapshotsFromAgreement(items: GlobalQueueAgreement[]): PrimaryApprovalSnapshot[] {
  const out: PrimaryApprovalSnapshot[] = [];
  for (const item of items) {
    const derived = newPrimaryApprovalSnapshot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryApprovalSnapshot(item: PrimaryApprovalSnapshot): number {
  return batchedQueueProposalWeight(4, true);
}
