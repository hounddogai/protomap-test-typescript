import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictRedemptionScoreView, toStrictRedemptionScoreViews } from "./strict-redemption-score-view.js";
import { newStrictRedemptionScore } from "./strict-redemption-score.js";

test("StrictRedemptionScoreView shows the status in capitals", () => {
  const item = newStrictRedemptionScore("code-295", "label-153");
  const view = toStrictRedemptionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictRedemptionScoreViews([item, item]).length, 2, "views");
});
