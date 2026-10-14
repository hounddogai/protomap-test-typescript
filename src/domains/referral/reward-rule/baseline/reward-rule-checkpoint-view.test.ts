import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleCheckpointView, toRewardRuleCheckpointViews } from "./reward-rule-checkpoint-view.js";
import { newRewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

test("RewardRuleCheckpointView shows the status in capitals", () => {
  const item = newRewardRuleCheckpoint("code-328", "name-140");
  const view = toRewardRuleCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleCheckpointViews([item, item]).length, 2, "views");
});
