import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedRewardRuleOverrideView,
  toBatchedRewardRuleOverrideViews,
} from "./batched-reward-rule-override-view.js";
import { newBatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

test("BatchedRewardRuleOverrideView shows the status in capitals", () => {
  const item = newBatchedRewardRuleOverride("code-46", "name-816");
  const view = toBatchedRewardRuleOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedRewardRuleOverrideViews([item, item]).length, 2, "views");
});
