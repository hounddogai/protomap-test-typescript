import { normalizeOptOutPlanCode } from "../../opt-out/window/opt-out-plan-policy.js";
import { OptOutWindow } from "../../opt-out/window/opt-out-window.js";
import { PreferenceDraft, newPreferenceDraft } from "./preference-draft.js";

export function summarizeOptOutWindowsForDraft(items: OptOutWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePreferenceDraftsFromWindow(items: OptOutWindow[]): PreferenceDraft[] {
  const out: PreferenceDraft[] = [];
  for (const item of items) {
    const derived = newPreferenceDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolvePreferenceDraft(item: PreferenceDraft): string {
  return normalizeOptOutPlanCode(item.code);
}
