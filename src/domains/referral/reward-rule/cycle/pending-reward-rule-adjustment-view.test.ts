import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingRewardRuleAdjustmentView,
  toPendingRewardRuleAdjustmentViews,
} from "./pending-reward-rule-adjustment-view.js";
import { newPendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

test("PendingRewardRuleAdjustmentView shows the status in capitals", () => {
  const item = newPendingRewardRuleAdjustment("code-970", "label-381");
  const view = toPendingRewardRuleAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRewardRuleAdjustmentViews([item, item]).length, 2, "views");
});
