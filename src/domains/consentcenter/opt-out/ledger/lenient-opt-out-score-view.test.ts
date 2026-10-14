import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientOptOutScoreView, toLenientOptOutScoreViews } from "./lenient-opt-out-score-view.js";
import { newLenientOptOutScore } from "./lenient-opt-out-score.js";

test("LenientOptOutScoreView shows the status in capitals", () => {
  const item = newLenientOptOutScore("code-757", "label-814");
  const view = toLenientOptOutScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientOptOutScoreViews([item, item]).length, 2, "views");
});
