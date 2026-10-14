import { ComplaintAudit } from "../../complaint/ledger/complaint-audit.js";
import { classifyComplaintLedger } from "../../complaint/ledger/complaint-ledger-policy.js";
import { PendingWarmupRule, newPendingWarmupRule } from "./pending-warmup-rule.js";

export function summarizeComplaintAuditsForRule(items: ComplaintAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function derivePendingWarmupRulesFromAudit(items: ComplaintAudit[]): PendingWarmupRule[] {
  const out: PendingWarmupRule[] = [];
  for (const item of items) {
    const derived = newPendingWarmupRule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scorePendingWarmupRule(item: PendingWarmupRule): string {
  return classifyComplaintLedger(item.weightedExposure());
}
