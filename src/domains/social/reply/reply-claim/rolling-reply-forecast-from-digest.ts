import { AdaptivePostDigest } from "../../post/target/adaptive-post-digest.js";
import { normalizeRegionalPostAdjustmentCode } from "../../post/target/regional-post-adjustment-policy.js";
import { RollingReplyForecast, newRollingReplyForecast } from "./rolling-reply-forecast.js";

export function summarizeAdaptivePostDigestsForForecast(items: AdaptivePostDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingReplyForecastsFromDigest(items: AdaptivePostDigest[]): RollingReplyForecast[] {
  const out: RollingReplyForecast[] = [];
  for (const item of items) {
    const derived = newRollingReplyForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRollingReplyForecast(item: RollingReplyForecast): string {
  return normalizeRegionalPostAdjustmentCode(item.code);
}
