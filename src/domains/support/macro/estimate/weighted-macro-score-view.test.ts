import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedMacroScoreView, toWeightedMacroScoreViews } from "./weighted-macro-score-view.js";
import { newWeightedMacroScore } from "./weighted-macro-score.js";

test("WeightedMacroScoreView shows the status in capitals", () => {
  const item = newWeightedMacroScore("code-752", "label-241");
  const view = toWeightedMacroScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedMacroScoreViews([item, item]).length, 2, "views");
});
