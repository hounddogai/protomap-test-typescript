import { classifyWaitDraft } from "../../wait/draft/wait-draft-policy.js";
import { WaitDraft } from "../../wait/draft/wait-draft.js";
import { RollingJourneyAgreement, newRollingJourneyAgreement } from "./rolling-journey-agreement.js";

export function summarizeWaitDraftsForAgreement(items: WaitDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRollingJourneyAgreementsFromDraft(items: WaitDraft[]): RollingJourneyAgreement[] {
  const out: RollingJourneyAgreement[] = [];
  for (const item of items) {
    const derived = newRollingJourneyAgreement(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRollingJourneyAgreement(item: RollingJourneyAgreement): string {
  return classifyWaitDraft(item.effectiveValue());
}
