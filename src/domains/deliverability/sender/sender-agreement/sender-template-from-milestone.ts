import { classifyManualBounceMilestone } from "../../bounce/claim/manual-bounce-milestone-policy.js";
import { ManualBounceMilestone } from "../../bounce/claim/manual-bounce-milestone.js";
import { SenderTemplate, newSenderTemplate } from "./sender-template.js";

export function summarizeManualBounceMilestonesForTemplate(items: ManualBounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSenderTemplatesFromMilestone(items: ManualBounceMilestone[]): SenderTemplate[] {
  const out: SenderTemplate[] = [];
  for (const item of items) {
    const derived = newSenderTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeSenderTemplate(item: SenderTemplate): string {
  return classifyManualBounceMilestone(item.effectiveTotal());
}
