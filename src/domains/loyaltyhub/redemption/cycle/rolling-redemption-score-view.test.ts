import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingRedemptionScoreView, toRollingRedemptionScoreViews } from "./rolling-redemption-score-view.js";
import { newRollingRedemptionScore } from "./rolling-redemption-score.js";

test("RollingRedemptionScoreView shows the status in capitals", () => {
  const item = newRollingRedemptionScore("code-596", "title-471");
  const view = toRollingRedemptionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingRedemptionScoreViews([item, item]).length, 2, "views");
});
