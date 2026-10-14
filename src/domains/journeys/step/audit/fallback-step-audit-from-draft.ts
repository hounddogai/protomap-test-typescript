import { SeasonalStepDraft } from "../window/seasonal-step-draft.js";
import { classifyStepWindow } from "../window/step-window-policy.js";
import { FallbackStepAudit, newFallbackStepAudit } from "./fallback-step-audit.js";

export function summarizeSeasonalStepDraftsForAudit(items: SeasonalStepDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveFallbackStepAuditsFromDraft(items: SeasonalStepDraft[]): FallbackStepAudit[] {
  const out: FallbackStepAudit[] = [];
  for (const item of items) {
    const derived = newFallbackStepAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleFallbackStepAudit(item: FallbackStepAudit): string {
  return classifyStepWindow(item.projectedVolume());
}
