import { StrictWarmupManifest } from "../../warmup/baseline/strict-warmup-manifest.js";
import { normalizeWarmupBaselineCode } from "../../warmup/baseline/warmup-baseline-policy.js";
import { DefaultSenderDraft, newDefaultSenderDraft } from "./default-sender-draft.js";

export function summarizeStrictWarmupManifestsForDraft(items: StrictWarmupManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveDefaultSenderDraftsFromManifest(items: StrictWarmupManifest[]): DefaultSenderDraft[] {
  const out: DefaultSenderDraft[] = [];
  for (const item of items) {
    const derived = newDefaultSenderDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectDefaultSenderDraft(item: DefaultSenderDraft): string {
  return normalizeWarmupBaselineCode(item.code);
}
