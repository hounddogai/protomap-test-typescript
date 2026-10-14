import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardScoreView, toRewardScoreViews } from "./reward-score-view.js";
import { newRewardScore } from "./reward-score.js";

test("RewardScoreView shows the status in capitals", () => {
  const item = newRewardScore("code-664", "name-78");
  const view = toRewardScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardScoreViews([item, item]).length, 2, "views");
});
