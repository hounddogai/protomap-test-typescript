import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedRewardRuleSummaryView,
  toWeightedRewardRuleSummaryViews,
} from "./weighted-reward-rule-summary-view.js";
import { newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

test("WeightedRewardRuleSummaryView shows the status in capitals", () => {
  const item = newWeightedRewardRuleSummary("code-722", "label-565");
  const view = toWeightedRewardRuleSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRewardRuleSummaryViews([item, item]).length, 2, "views");
});
