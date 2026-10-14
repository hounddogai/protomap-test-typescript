import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortScoreView, toCohortScoreViews } from "./cohort-score-view.js";
import { newCohortScore } from "./cohort-score.js";

test("CohortScoreView shows the status in capitals", () => {
  const item = newCohortScore("code-2", "title-858");
  const view = toCohortScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortScoreViews([item, item]).length, 2, "views");
});
