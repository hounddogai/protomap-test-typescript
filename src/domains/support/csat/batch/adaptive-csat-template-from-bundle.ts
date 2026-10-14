import {
  normalizeGlobalEscalationBundleCode,
} from "../../escalation/lenient-escalation-notice/global-escalation-bundle-policy.js";
import { GlobalEscalationBundle } from "../../escalation/lenient-escalation-notice/global-escalation-bundle.js";
import { AdaptiveCsatTemplate, newAdaptiveCsatTemplate } from "./adaptive-csat-template.js";

export function summarizeGlobalEscalationBundlesForTemplate(items: GlobalEscalationBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptiveCsatTemplatesFromBundle(items: GlobalEscalationBundle[]): AdaptiveCsatTemplate[] {
  const out: AdaptiveCsatTemplate[] = [];
  for (const item of items) {
    const derived = newAdaptiveCsatTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankAdaptiveCsatTemplate(item: AdaptiveCsatTemplate): string {
  return normalizeGlobalEscalationBundleCode(item.code);
}
