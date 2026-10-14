import { ModelNotice } from "../notice/model-notice.js";
import { modelOverrideBucket } from "../notice/model-override-policy.js";
import { ModelPreference, newModelPreference } from "./model-preference.js";

export function summarizeModelNoticesForPreference(items: ModelNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveModelPreferencesFromNotice(items: ModelNotice[]): ModelPreference[] {
  const out: ModelPreference[] = [];
  for (const item of items) {
    const derived = newModelPreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveModelPreference(item: ModelPreference): string {
  return modelOverrideBucket(item.projectedTotal());
}
