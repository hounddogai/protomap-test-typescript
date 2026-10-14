import { badgeSummaryWeight } from "../../badge/digest/badge-summary-policy.js";
import { BadgeSummary } from "../../badge/digest/badge-summary.js";
import { ManualRedemptionAgreement, newManualRedemptionAgreement } from "./manual-redemption-agreement.js";

export function summarizeBadgeSummariesForAgreement(items: BadgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualRedemptionAgreementsFromSummary(items: BadgeSummary[]): ManualRedemptionAgreement[] {
  const out: ManualRedemptionAgreement[] = [];
  for (const item of items) {
    const derived = newManualRedemptionAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeManualRedemptionAgreement(item: ManualRedemptionAgreement): number {
  return badgeSummaryWeight(4, true);
}
