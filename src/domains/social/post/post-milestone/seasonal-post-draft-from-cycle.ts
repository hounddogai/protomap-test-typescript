import { mentionCycleBucket } from "../../mention/cycle/mention-cycle-policy.js";
import { MentionCycle } from "../../mention/cycle/mention-cycle.js";
import { SeasonalPostDraft, newSeasonalPostDraft } from "./seasonal-post-draft.js";

export function summarizeMentionCyclesForDraft(items: MentionCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalPostDraftsFromCycle(items: MentionCycle[]): SeasonalPostDraft[] {
  const out: SeasonalPostDraft[] = [];
  for (const item of items) {
    const derived = newSeasonalPostDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeSeasonalPostDraft(item: SeasonalPostDraft): string {
  return mentionCycleBucket(item.projectedLoad());
}
