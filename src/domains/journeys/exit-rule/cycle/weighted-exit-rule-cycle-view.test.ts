import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedExitRuleCycleView, toWeightedExitRuleCycleViews } from "./weighted-exit-rule-cycle-view.js";
import { newWeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

test("WeightedExitRuleCycleView shows the status in capitals", () => {
  const item = newWeightedExitRuleCycle("code-240", "title-355");
  const view = toWeightedExitRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedExitRuleCycleViews([item, item]).length, 2, "views");
});
