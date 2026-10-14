import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveRewardRuleSummaryView,
  toAdaptiveRewardRuleSummaryViews,
} from "./adaptive-reward-rule-summary-view.js";
import { newAdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

test("AdaptiveRewardRuleSummaryView shows the status in capitals", () => {
  const item = newAdaptiveRewardRuleSummary("code-786", "name-60");
  const view = toAdaptiveRewardRuleSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRewardRuleSummaryViews([item, item]).length, 2, "views");
});
