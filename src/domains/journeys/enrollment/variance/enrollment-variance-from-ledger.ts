import { normalizeBranchLedgerCode } from "../../branch/record-item/branch-ledger-policy.js";
import { BranchLedger } from "../../branch/record-item/branch-ledger.js";
import { EnrollmentVariance, newEnrollmentVariance } from "./enrollment-variance.js";

export function summarizeBranchLedgersForVariance(items: BranchLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveEnrollmentVariancesFromLedger(items: BranchLedger[]): EnrollmentVariance[] {
  const out: EnrollmentVariance[] = [];
  for (const item of items) {
    const derived = newEnrollmentVariance(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitEnrollmentVariance(item: EnrollmentVariance): string {
  return normalizeBranchLedgerCode(item.code);
}
