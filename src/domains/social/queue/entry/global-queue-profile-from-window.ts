import { classifyLenientPostWindow } from "../../post/scheduled-post-milestone/lenient-post-window-policy.js";
import { LenientPostWindow } from "../../post/scheduled-post-milestone/lenient-post-window.js";
import { GlobalQueueProfile, newGlobalQueueProfile } from "./global-queue-profile.js";

export function summarizeLenientPostWindowsForProfile(items: LenientPostWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalQueueProfilesFromWindow(items: LenientPostWindow[]): GlobalQueueProfile[] {
  const out: GlobalQueueProfile[] = [];
  for (const item of items) {
    const derived = newGlobalQueueProfile(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planGlobalQueueProfile(item: GlobalQueueProfile): string {
  return classifyLenientPostWindow(item.weightedExposure());
}
