import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardSummaryView, toRewardSummaryViews } from "./reward-summary-view.js";
import { newRewardSummary } from "./reward-summary.js";

test("RewardSummaryView shows the status in capitals", () => {
  const item = newRewardSummary("code-12", "name-705");
  const view = toRewardSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardSummaryViews([item, item]).length, 2, "views");
});
