import { manualNudgeOverrideBucket } from "../preference/manual-nudge-override-policy.js";
import { NudgePreference } from "../preference/nudge-preference.js";
import { NudgeTemplate, newNudgeTemplate } from "./nudge-template.js";

export function summarizeNudgePreferencesForTemplate(items: NudgePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveNudgeTemplatesFromPreference(items: NudgePreference[]): NudgeTemplate[] {
  const out: NudgeTemplate[] = [];
  for (const item of items) {
    const derived = newNudgeTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeNudgeTemplate(item: NudgeTemplate): string {
  return manualNudgeOverrideBucket(item.netLoad());
}
