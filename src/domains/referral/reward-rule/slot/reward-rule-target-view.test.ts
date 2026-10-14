import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleTargetView, toRewardRuleTargetViews } from "./reward-rule-target-view.js";
import { newRewardRuleTarget } from "./reward-rule-target.js";

test("RewardRuleTargetView shows the status in capitals", () => {
  const item = newRewardRuleTarget("code-353", "label-202");
  const view = toRewardRuleTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleTargetViews([item, item]).length, 2, "views");
});
