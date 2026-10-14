import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierScoreView, toTierScoreViews } from "./tier-score-view.js";
import { newTierScore } from "./tier-score.js";

test("TierScoreView shows the status in capitals", () => {
  const item = newTierScore("code-609", "name-902");
  const view = toTierScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierScoreViews([item, item]).length, 2, "views");
});
