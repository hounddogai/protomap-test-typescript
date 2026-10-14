import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyScoreView, toFrequencyScoreViews } from "./frequency-score-view.js";
import { newFrequencyScore } from "./frequency-score.js";

test("FrequencyScoreView shows the status in capitals", () => {
  const item = newFrequencyScore("code-173", "label-723");
  const view = toFrequencyScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyScoreViews([item, item]).length, 2, "views");
});
