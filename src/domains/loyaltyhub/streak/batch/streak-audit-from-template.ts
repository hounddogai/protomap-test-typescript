import { normalizeScheduledStreakTemplateCode } from "../profile/scheduled-streak-template-policy.js";
import { ScheduledStreakTemplate } from "../profile/scheduled-streak-template.js";
import { StreakAudit, newStreakAudit } from "./streak-audit.js";

export function summarizeScheduledStreakTemplatesForAudit(items: ScheduledStreakTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveStreakAuditsFromTemplate(items: ScheduledStreakTemplate[]): StreakAudit[] {
  const out: StreakAudit[] = [];
  for (const item of items) {
    const derived = newStreakAudit(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateStreakAudit(item: StreakAudit): string {
  return normalizeScheduledStreakTemplateCode(item.code);
}
