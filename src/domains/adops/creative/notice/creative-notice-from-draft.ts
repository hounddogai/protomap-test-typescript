import { cappedFrequencyEntryWeight } from "../../frequency/draft/capped-frequency-entry-policy.js";
import { DefaultFrequencyDraft } from "../../frequency/draft/default-frequency-draft.js";
import { CreativeNotice, newCreativeNotice } from "./creative-notice.js";

export function summarizeDefaultFrequencyDraftsForNotice(items: DefaultFrequencyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreativeNoticesFromDraft(items: DefaultFrequencyDraft[]): CreativeNotice[] {
  const out: CreativeNotice[] = [];
  for (const item of items) {
    const derived = newCreativeNotice(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCreativeNotice(item: CreativeNotice): number {
  return cappedFrequencyEntryWeight(6, true);
}
