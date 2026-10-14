import {
  normalizeFallbackNudgeSummaryCode,
} from "../../nudge/regional-nudge-exception/fallback-nudge-summary-policy.js";
import { PendingNudgeTemplate } from "../../nudge/regional-nudge-exception/pending-nudge-template.js";
import { LenientActivationBundle, newLenientActivationBundle } from "./lenient-activation-bundle.js";

export function summarizePendingNudgeTemplatesForBundle(items: PendingNudgeTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLenientActivationBundlesFromTemplate(items: PendingNudgeTemplate[]): LenientActivationBundle[] {
  const out: LenientActivationBundle[] = [];
  for (const item of items) {
    const derived = newLenientActivationBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyLenientActivationBundle(item: LenientActivationBundle): string {
  return normalizeFallbackNudgeSummaryCode(item.code);
}
