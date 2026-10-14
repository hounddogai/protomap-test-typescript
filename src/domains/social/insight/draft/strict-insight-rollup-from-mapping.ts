import {
  classifyAdaptiveMentionAllocation,
} from "../../mention/mention-digest/adaptive-mention-allocation-policy.js";
import { DefaultMentionMapping } from "../../mention/mention-digest/default-mention-mapping.js";
import { StrictInsightRollup, newStrictInsightRollup } from "./strict-insight-rollup.js";

export function summarizeDefaultMentionMappingsForRollup(items: DefaultMentionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveStrictInsightRollupsFromMapping(items: DefaultMentionMapping[]): StrictInsightRollup[] {
  const out: StrictInsightRollup[] = [];
  for (const item of items) {
    const derived = newStrictInsightRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveStrictInsightRollup(item: StrictInsightRollup): string {
  return classifyAdaptiveMentionAllocation(item.netTotal());
}
