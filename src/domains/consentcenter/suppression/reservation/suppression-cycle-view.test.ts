import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionCycleView, toSuppressionCycleViews } from "./suppression-cycle-view.js";
import { newSuppressionCycle } from "./suppression-cycle.js";

test("SuppressionCycleView shows the status in capitals", () => {
  const item = newSuppressionCycle("code-189", "name-593");
  const view = toSuppressionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionCycleViews([item, item]).length, 2, "views");
});
