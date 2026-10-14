import { normalizeCreditSummaryCode } from "../request/credit-summary-policy.js";
import { CreditSummary } from "../request/credit-summary.js";
import { DefaultCreditDigest, newDefaultCreditDigest } from "./default-credit-digest.js";

export function summarizeCreditSummariesForDigest(items: CreditSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveDefaultCreditDigestsFromSummary(items: CreditSummary[]): DefaultCreditDigest[] {
  const out: DefaultCreditDigest[] = [];
  for (const item of items) {
    const derived = newDefaultCreditDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleDefaultCreditDigest(item: DefaultCreditDigest): string {
  return normalizeCreditSummaryCode(item.code);
}
