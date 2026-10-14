import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingRewardRuleEstimateView,
  toPendingRewardRuleEstimateViews,
} from "./pending-reward-rule-estimate-view.js";
import { newPendingRewardRuleEstimate } from "./pending-reward-rule-estimate.js";

test("PendingRewardRuleEstimateView shows the status in capitals", () => {
  const item = newPendingRewardRuleEstimate("code-853", "name-620");
  const view = toPendingRewardRuleEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRewardRuleEstimateViews([item, item]).length, 2, "views");
});
