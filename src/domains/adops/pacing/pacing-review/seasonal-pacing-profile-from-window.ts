import { normalizePacingWindowCode } from "../window/pacing-window-policy.js";
import { PacingWindow } from "../window/pacing-window.js";
import { SeasonalPacingProfile, newSeasonalPacingProfile } from "./seasonal-pacing-profile.js";

export function summarizePacingWindowsForProfile(items: PacingWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalPacingProfilesFromWindow(items: PacingWindow[]): SeasonalPacingProfile[] {
  const out: SeasonalPacingProfile[] = [];
  for (const item of items) {
    const derived = newSeasonalPacingProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveSeasonalPacingProfile(item: SeasonalPacingProfile): string {
  return normalizePacingWindowCode(item.code);
}
