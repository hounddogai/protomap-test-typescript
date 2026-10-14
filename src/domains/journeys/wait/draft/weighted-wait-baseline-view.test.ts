import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedWaitBaselineView, toWeightedWaitBaselineViews } from "./weighted-wait-baseline-view.js";
import { newWeightedWaitBaseline } from "./weighted-wait-baseline.js";

test("WeightedWaitBaselineView shows the status in capitals", () => {
  const item = newWeightedWaitBaseline("code-414", "title-906");
  const view = toWeightedWaitBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedWaitBaselineViews([item, item]).length, 2, "views");
});
