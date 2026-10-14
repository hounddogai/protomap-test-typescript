import { normalizePostAllocationCode } from "../../post/milestone/post-allocation-policy.js";
import { PostMilestone } from "../../post/milestone/post-milestone.js";
import { ReplyForecast, newReplyForecast } from "./reply-forecast.js";

export function summarizePostMilestonesForForecast(items: PostMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveReplyForecastsFromMilestone(items: PostMilestone[]): ReplyForecast[] {
  const out: ReplyForecast[] = [];
  for (const item of items) {
    const derived = newReplyForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreReplyForecast(item: ReplyForecast): string {
  return normalizePostAllocationCode(item.code);
}
