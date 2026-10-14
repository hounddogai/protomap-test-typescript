import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakScoreView, toStreakScoreViews } from "./streak-score-view.js";
import { newStreakScore } from "./streak-score.js";

test("StreakScoreView shows the status in capitals", () => {
  const item = newStreakScore("code-361", "title-110");
  const view = toStreakScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakScoreViews([item, item]).length, 2, "views");
});
