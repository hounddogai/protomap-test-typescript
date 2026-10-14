import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientBounceScoreView, toLenientBounceScoreViews } from "./lenient-bounce-score-view.js";
import { newLenientBounceScore } from "./lenient-bounce-score.js";

test("LenientBounceScoreView shows the status in capitals", () => {
  const item = newLenientBounceScore("code-999", "title-268");
  const view = toLenientBounceScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientBounceScoreViews([item, item]).length, 2, "views");
});
