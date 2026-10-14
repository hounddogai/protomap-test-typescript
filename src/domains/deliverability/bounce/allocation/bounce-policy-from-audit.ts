import { ComplaintAudit } from "../../complaint/ledger/complaint-audit.js";
import { classifyComplaintLedger } from "../../complaint/ledger/complaint-ledger-policy.js";
import { BouncePolicy, newBouncePolicy } from "./bounce-policy.js";

export function summarizeComplaintAuditsForPolicy(items: ComplaintAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveBouncePoliciesFromAudit(items: ComplaintAudit[]): BouncePolicy[] {
  const out: BouncePolicy[] = [];
  for (const item of items) {
    const derived = newBouncePolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreBouncePolicy(item: BouncePolicy): string {
  return classifyComplaintLedger(item.projectedExposure());
}
