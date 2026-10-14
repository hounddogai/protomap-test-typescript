import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionScoreView, toConversionScoreViews } from "./conversion-score-view.js";
import { newConversionScore } from "./conversion-score.js";

test("ConversionScoreView shows the status in capitals", () => {
  const item = newConversionScore("code-865", "label-625");
  const view = toConversionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionScoreViews([item, item]).length, 2, "views");
});
