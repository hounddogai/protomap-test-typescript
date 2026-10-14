import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedStreakSummaryView, toWeightedStreakSummaryViews } from "./weighted-streak-summary-view.js";
import { newWeightedStreakSummary } from "./weighted-streak-summary.js";

test("WeightedStreakSummaryView shows the status in capitals", () => {
  const item = newWeightedStreakSummary("code-873", "title-900");
  const view = toWeightedStreakSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedStreakSummaryViews([item, item]).length, 2, "views");
});
