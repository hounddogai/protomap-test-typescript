import { warmupTemplateWeight } from "../../warmup/batch/warmup-template-policy.js";
import { WarmupTemplate } from "../../warmup/batch/warmup-template.js";
import { ReputationSchedule, newReputationSchedule } from "./reputation-schedule.js";

export function summarizeWarmupTemplatesForSchedule(items: WarmupTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveReputationSchedulesFromTemplate(items: WarmupTemplate[]): ReputationSchedule[] {
  const out: ReputationSchedule[] = [];
  for (const item of items) {
    const derived = newReputationSchedule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyReputationSchedule(item: ReputationSchedule): number {
  return warmupTemplateWeight(9, true);
}
