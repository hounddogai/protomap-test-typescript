import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredRewardRuleAdjustmentView,
  toTieredRewardRuleAdjustmentViews,
} from "./tiered-reward-rule-adjustment-view.js";
import { newTieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

test("TieredRewardRuleAdjustmentView shows the status in capitals", () => {
  const item = newTieredRewardRuleAdjustment("code-809", "title-334");
  const view = toTieredRewardRuleAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardRuleAdjustmentViews([item, item]).length, 2, "views");
});
