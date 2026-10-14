import { classifyPathEntry } from "../../path/policy/path-entry-policy.js";
import { PathEntry } from "../../path/policy/path-entry.js";
import { CreditClaim, newCreditClaim } from "./credit-claim.js";

export function summarizePathEntriesForClaim(items: PathEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCreditClaimsFromEntry(items: PathEntry[]): CreditClaim[] {
  const out: CreditClaim[] = [];
  for (const item of items) {
    const derived = newCreditClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreCreditClaim(item: CreditClaim): string {
  return classifyPathEntry(item.measuredValue());
}
