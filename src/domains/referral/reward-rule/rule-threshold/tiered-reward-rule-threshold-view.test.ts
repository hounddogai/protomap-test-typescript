import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredRewardRuleThresholdView,
  toTieredRewardRuleThresholdViews,
} from "./tiered-reward-rule-threshold-view.js";
import { newTieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

test("TieredRewardRuleThresholdView shows the status in capitals", () => {
  const item = newTieredRewardRuleThreshold("code-399", "label-569");
  const view = toTieredRewardRuleThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardRuleThresholdViews([item, item]).length, 2, "views");
});
