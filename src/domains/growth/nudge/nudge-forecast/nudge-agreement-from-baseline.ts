import { regionalNudgeBaselineWeight } from "../baseline/regional-nudge-baseline-policy.js";
import { RegionalNudgeBaseline } from "../baseline/regional-nudge-baseline.js";
import { NudgeAgreement, newNudgeAgreement } from "./nudge-agreement.js";

export function summarizeRegionalNudgeBaselinesForAgreement(items: RegionalNudgeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveNudgeAgreementsFromBaseline(items: RegionalNudgeBaseline[]): NudgeAgreement[] {
  const out: NudgeAgreement[] = [];
  for (const item of items) {
    const derived = newNudgeAgreement(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleNudgeAgreement(item: NudgeAgreement): number {
  return regionalNudgeBaselineWeight(9, true);
}
