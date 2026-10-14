import { scheduledWindowAuditBucket } from "../../window/rule/scheduled-window-audit-policy.js";
import { WindowRule } from "../../window/rule/window-rule.js";
import { TouchpointSnapshot, newTouchpointSnapshot } from "./touchpoint-snapshot.js";

export function summarizeWindowRulesForSnapshot(items: WindowRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveTouchpointSnapshotsFromRule(items: WindowRule[]): TouchpointSnapshot[] {
  const out: TouchpointSnapshot[] = [];
  for (const item of items) {
    const derived = newTouchpointSnapshot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTouchpointSnapshot(item: TouchpointSnapshot): string {
  return scheduledWindowAuditBucket(item.effectiveValue());
}
