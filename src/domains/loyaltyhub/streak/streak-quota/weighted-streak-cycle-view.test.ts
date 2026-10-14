import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedStreakCycleView, toWeightedStreakCycleViews } from "./weighted-streak-cycle-view.js";
import { newWeightedStreakCycle } from "./weighted-streak-cycle.js";

test("WeightedStreakCycleView shows the status in capitals", () => {
  const item = newWeightedStreakCycle("code-193", "label-70");
  const view = toWeightedStreakCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedStreakCycleViews([item, item]).length, 2, "views");
});
