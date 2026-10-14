import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCohortScoreView, toAdaptiveCohortScoreViews } from "./adaptive-cohort-score-view.js";
import { newAdaptiveCohortScore } from "./adaptive-cohort-score.js";

test("AdaptiveCohortScoreView shows the status in capitals", () => {
  const item = newAdaptiveCohortScore("code-88", "label-790");
  const view = toAdaptiveCohortScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCohortScoreViews([item, item]).length, 2, "views");
});
