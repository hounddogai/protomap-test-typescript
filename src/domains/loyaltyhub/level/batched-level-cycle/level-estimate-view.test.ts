import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelEstimateView, toLevelEstimateViews } from "./level-estimate-view.js";
import { newLevelEstimate } from "./level-estimate.js";

test("LevelEstimateView shows the status in capitals", () => {
  const item = newLevelEstimate("code-39", "name-456");
  const view = toLevelEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelEstimateViews([item, item]).length, 2, "views");
});
