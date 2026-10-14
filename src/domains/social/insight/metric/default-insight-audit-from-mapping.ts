import { mentionMappingWeight } from "../../mention/entry/mention-mapping-policy.js";
import { MentionMapping } from "../../mention/entry/mention-mapping.js";
import { DefaultInsightAudit, newDefaultInsightAudit } from "./default-insight-audit.js";

export function summarizeMentionMappingsForAudit(items: MentionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultInsightAuditsFromMapping(items: MentionMapping[]): DefaultInsightAudit[] {
  const out: DefaultInsightAudit[] = [];
  for (const item of items) {
    const derived = newDefaultInsightAudit(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeDefaultInsightAudit(item: DefaultInsightAudit): number {
  return mentionMappingWeight(4, true);
}
