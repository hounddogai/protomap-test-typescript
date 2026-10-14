import { classifyNudgeRequest } from "../../nudge/preference/nudge-request-policy.js";
import { RollingNudgePreference } from "../../nudge/preference/rolling-nudge-preference.js";
import { ActivationDraft, newActivationDraft } from "./activation-draft.js";

export function summarizeRollingNudgePreferencesForDraft(items: RollingNudgePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveActivationDraftsFromPreference(items: RollingNudgePreference[]): ActivationDraft[] {
  const out: ActivationDraft[] = [];
  for (const item of items) {
    const derived = newActivationDraft(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateActivationDraft(item: ActivationDraft): string {
  return classifyNudgeRequest(item.effectiveExposure());
}
