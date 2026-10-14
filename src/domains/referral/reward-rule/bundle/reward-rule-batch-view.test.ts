import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleBatchView, toRewardRuleBatchViews } from "./reward-rule-batch-view.js";
import { newRewardRuleBatch } from "./reward-rule-batch.js";

test("RewardRuleBatchView shows the status in capitals", () => {
  const item = newRewardRuleBatch("code-69", "name-765");
  const view = toRewardRuleBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleBatchViews([item, item]).length, 2, "views");
});
