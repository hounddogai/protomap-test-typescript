import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledTierScoreView, toScheduledTierScoreViews } from "./scheduled-tier-score-view.js";
import { newScheduledTierScore } from "./scheduled-tier-score.js";

test("ScheduledTierScoreView shows the status in capitals", () => {
  const item = newScheduledTierScore("code-661", "label-557");
  const view = toScheduledTierScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledTierScoreViews([item, item]).length, 2, "views");
});
