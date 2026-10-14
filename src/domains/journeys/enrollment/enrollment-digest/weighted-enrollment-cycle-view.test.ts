import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedEnrollmentCycleView, toWeightedEnrollmentCycleViews } from "./weighted-enrollment-cycle-view.js";
import { newWeightedEnrollmentCycle } from "./weighted-enrollment-cycle.js";

test("WeightedEnrollmentCycleView shows the status in capitals", () => {
  const item = newWeightedEnrollmentCycle("code-576", "label-767");
  const view = toWeightedEnrollmentCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedEnrollmentCycleViews([item, item]).length, 2, "views");
});
