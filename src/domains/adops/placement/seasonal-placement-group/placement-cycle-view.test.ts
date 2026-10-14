import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementCycleView, toPlacementCycleViews } from "./placement-cycle-view.js";
import { newPlacementCycle } from "./placement-cycle.js";

test("PlacementCycleView shows the status in capitals", () => {
  const item = newPlacementCycle("code-499", "name-741");
  const view = toPlacementCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementCycleViews([item, item]).length, 2, "views");
});
