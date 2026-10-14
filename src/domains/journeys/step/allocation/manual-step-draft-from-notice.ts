import { ExitRuleNotice } from "../../exit-rule/digest/exit-rule-notice.js";
import { normalizeExitRuleTargetCode } from "../../exit-rule/digest/exit-rule-target-policy.js";
import { ManualStepDraft, newManualStepDraft } from "./manual-step-draft.js";

export function summarizeExitRuleNoticesForDraft(items: ExitRuleNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualStepDraftsFromNotice(items: ExitRuleNotice[]): ManualStepDraft[] {
  const out: ManualStepDraft[] = [];
  for (const item of items) {
    const derived = newManualStepDraft(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceManualStepDraft(item: ManualStepDraft): string {
  return normalizeExitRuleTargetCode(item.code);
}
