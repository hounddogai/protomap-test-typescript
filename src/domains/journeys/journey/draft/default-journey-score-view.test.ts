import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultJourneyScoreView, toDefaultJourneyScoreViews } from "./default-journey-score-view.js";
import { newDefaultJourneyScore } from "./default-journey-score.js";

test("DefaultJourneyScoreView shows the status in capitals", () => {
  const item = newDefaultJourneyScore("code-138", "name-643");
  const view = toDefaultJourneyScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultJourneyScoreViews([item, item]).length, 2, "views");
});
