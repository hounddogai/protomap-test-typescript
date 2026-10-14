import { normalizeCappedWaitDigestCode } from "../../wait/digest/capped-wait-digest-policy.js";
import { WaitReservation } from "../../wait/digest/wait-reservation.js";
import { BranchAudit, newBranchAudit } from "./branch-audit.js";

export function summarizeWaitReservationsForAudit(items: WaitReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBranchAuditsFromReservation(items: WaitReservation[]): BranchAudit[] {
  const out: BranchAudit[] = [];
  for (const item of items) {
    const derived = newBranchAudit(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyBranchAudit(item: BranchAudit): string {
  return normalizeCappedWaitDigestCode(item.code);
}
