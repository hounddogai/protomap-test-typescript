import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedCsatCycleView, toWeightedCsatCycleViews } from "./weighted-csat-cycle-view.js";
import { newWeightedCsatCycle } from "./weighted-csat-cycle.js";

test("WeightedCsatCycleView shows the status in capitals", () => {
  const item = newWeightedCsatCycle("code-77", "name-975");
  const view = toWeightedCsatCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedCsatCycleViews([item, item]).length, 2, "views");
});
