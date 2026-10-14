import { queueTemplateWeight } from "../../queue/target/queue-template-policy.js";
import { QueueTemplate } from "../../queue/target/queue-template.js";
import { InsightProfile, newInsightProfile } from "./insight-profile.js";

export function summarizeQueueTemplatesForProfile(items: QueueTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveInsightProfilesFromTemplate(items: QueueTemplate[]): InsightProfile[] {
  const out: InsightProfile[] = [];
  for (const item of items) {
    const derived = newInsightProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchInsightProfile(item: InsightProfile): number {
  return queueTemplateWeight(4, true);
}
