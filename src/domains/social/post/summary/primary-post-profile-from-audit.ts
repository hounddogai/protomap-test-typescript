import { DefaultPostAudit } from "../rollup/default-post-audit.js";
import { classifyRollingPostRollup } from "../rollup/rolling-post-rollup-policy.js";
import { PrimaryPostProfile, newPrimaryPostProfile } from "./primary-post-profile.js";

export function summarizeDefaultPostAuditsForProfile(items: DefaultPostAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryPostProfilesFromAudit(items: DefaultPostAudit[]): PrimaryPostProfile[] {
  const out: PrimaryPostProfile[] = [];
  for (const item of items) {
    const derived = newPrimaryPostProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePrimaryPostProfile(item: PrimaryPostProfile): string {
  return classifyRollingPostRollup(item.adjustedValue());
}
