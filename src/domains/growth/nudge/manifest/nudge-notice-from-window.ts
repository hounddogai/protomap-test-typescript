import { normalizeSeasonalNudgeWindowCode } from "../nudge-window/seasonal-nudge-window-policy.js";
import { SeasonalNudgeWindow } from "../nudge-window/seasonal-nudge-window.js";
import { NudgeNotice, newNudgeNotice } from "./nudge-notice.js";

export function summarizeSeasonalNudgeWindowsForNotice(items: SeasonalNudgeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveNudgeNoticesFromWindow(items: SeasonalNudgeWindow[]): NudgeNotice[] {
  const out: NudgeNotice[] = [];
  for (const item of items) {
    const derived = newNudgeNotice(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceNudgeNotice(item: NudgeNotice): string {
  return normalizeSeasonalNudgeWindowCode(item.code);
}
