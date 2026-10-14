import { StrictWindowNotice } from "../../window/rollup/strict-window-notice.js";
import { windowScoreWeight } from "../../window/rollup/window-score-policy.js";
import { PathTemplate, newPathTemplate } from "./path-template.js";

export function summarizeStrictWindowNoticesForTemplate(items: StrictWindowNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePathTemplatesFromNotice(items: StrictWindowNotice[]): PathTemplate[] {
  const out: PathTemplate[] = [];
  for (const item of items) {
    const derived = newPathTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planPathTemplate(item: PathTemplate): number {
  return windowScoreWeight(7, true);
}
