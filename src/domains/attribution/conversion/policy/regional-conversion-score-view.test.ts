import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalConversionScoreView, toRegionalConversionScoreViews } from "./regional-conversion-score-view.js";
import { newRegionalConversionScore } from "./regional-conversion-score.js";

test("RegionalConversionScoreView shows the status in capitals", () => {
  const item = newRegionalConversionScore("code-681", "label-478");
  const view = toRegionalConversionScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalConversionScoreViews([item, item]).length, 2, "views");
});
