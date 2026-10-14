import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientChallengeScoreView, toLenientChallengeScoreViews } from "./lenient-challenge-score-view.js";
import { newLenientChallengeScore } from "./lenient-challenge-score.js";

test("LenientChallengeScoreView shows the status in capitals", () => {
  const item = newLenientChallengeScore("code-899", "name-480");
  const view = toLenientChallengeScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientChallengeScoreViews([item, item]).length, 2, "views");
});
