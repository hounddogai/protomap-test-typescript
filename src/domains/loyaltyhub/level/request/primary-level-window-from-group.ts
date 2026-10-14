import { defaultBadgeGroupBucket } from "../../badge/adjustment/default-badge-group-policy.js";
import { DefaultBadgeGroup } from "../../badge/adjustment/default-badge-group.js";
import { PrimaryLevelWindow, newPrimaryLevelWindow } from "./primary-level-window.js";

export function summarizeDefaultBadgeGroupsForWindow(items: DefaultBadgeGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePrimaryLevelWindowsFromGroup(items: DefaultBadgeGroup[]): PrimaryLevelWindow[] {
  const out: PrimaryLevelWindow[] = [];
  for (const item of items) {
    const derived = newPrimaryLevelWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balancePrimaryLevelWindow(item: PrimaryLevelWindow): string {
  return defaultBadgeGroupBucket(item.adjustedLoad());
}
