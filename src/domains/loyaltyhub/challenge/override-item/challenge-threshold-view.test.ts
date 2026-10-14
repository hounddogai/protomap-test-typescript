import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeThresholdView, toChallengeThresholdViews } from "./challenge-threshold-view.js";
import { newChallengeThreshold } from "./challenge-threshold.js";

test("ChallengeThresholdView shows the status in capitals", () => {
  const item = newChallengeThreshold("code-92", "name-175");
  const view = toChallengeThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeThresholdViews([item, item]).length, 2, "views");
});
