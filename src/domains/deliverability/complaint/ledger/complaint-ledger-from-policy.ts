import { classifyRegionalSenderPolicy } from "../../sender/policy/regional-sender-policy-policy.js";
import { RegionalSenderPolicy } from "../../sender/policy/regional-sender-policy.js";
import { ComplaintLedger, newComplaintLedger } from "./complaint-ledger.js";

export function summarizeRegionalSenderPoliciesForLedger(items: RegionalSenderPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveComplaintLedgersFromPolicy(items: RegionalSenderPolicy[]): ComplaintLedger[] {
  const out: ComplaintLedger[] = [];
  for (const item of items) {
    const derived = newComplaintLedger(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyComplaintLedgerExtra(item: ComplaintLedger): string {
  return classifyRegionalSenderPolicy(item.measuredValue());
}
