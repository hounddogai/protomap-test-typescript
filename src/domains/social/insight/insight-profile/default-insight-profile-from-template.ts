import { classifyMentionBatch } from "../../mention/weighted-mention-ledger/mention-batch-policy.js";
import { MentionTemplate } from "../../mention/weighted-mention-ledger/mention-template.js";
import { DefaultInsightProfile, newDefaultInsightProfile } from "./default-insight-profile.js";

export function summarizeMentionTemplatesForProfile(items: MentionTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDefaultInsightProfilesFromTemplate(items: MentionTemplate[]): DefaultInsightProfile[] {
  const out: DefaultInsightProfile[] = [];
  for (const item of items) {
    const derived = newDefaultInsightProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeDefaultInsightProfile(item: DefaultInsightProfile): string {
  return classifyMentionBatch(item.effectiveLoad());
}
