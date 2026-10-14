import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPacingScoreView, toRollingPacingScoreViews } from "./rolling-pacing-score-view.js";
import { newRollingPacingScore } from "./rolling-pacing-score.js";

test("RollingPacingScoreView shows the status in capitals", () => {
  const item = newRollingPacingScore("code-826", "name-265");
  const view = toRollingPacingScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPacingScoreViews([item, item]).length, 2, "views");
});
