import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyStepScoreView, toLegacyStepScoreViews } from "./legacy-step-score-view.js";
import { newLegacyStepScore } from "./legacy-step-score.js";

test("LegacyStepScoreView shows the status in capitals", () => {
  const item = newLegacyStepScore("code-340", "title-972");
  const view = toLegacyStepScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyStepScoreViews([item, item]).length, 2, "views");
});
