import {
  lenientEnrollmentDraftWeight,
} from "../../enrollment/pending-enrollment-digest/lenient-enrollment-draft-policy.js";
import { LenientEnrollmentDraft } from "../../enrollment/pending-enrollment-digest/lenient-enrollment-draft.js";
import { AdaptiveExitRuleAudit, newAdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

export function summarizeLenientEnrollmentDraftsForAudit(items: LenientEnrollmentDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveAdaptiveExitRuleAuditsFromDraft(items: LenientEnrollmentDraft[]): AdaptiveExitRuleAudit[] {
  const out: AdaptiveExitRuleAudit[] = [];
  for (const item of items) {
    const derived = newAdaptiveExitRuleAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchAdaptiveExitRuleAudit(item: AdaptiveExitRuleAudit): number {
  return lenientEnrollmentDraftWeight(1, true);
}
