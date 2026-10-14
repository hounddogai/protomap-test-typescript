import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientRewardScoreView, toLenientRewardScoreViews } from "./lenient-reward-score-view.js";
import { newLenientRewardScore } from "./lenient-reward-score.js";

test("LenientRewardScoreView shows the status in capitals", () => {
  const item = newLenientRewardScore("code-128", "title-914");
  const view = toLenientRewardScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRewardScoreViews([item, item]).length, 2, "views");
});
