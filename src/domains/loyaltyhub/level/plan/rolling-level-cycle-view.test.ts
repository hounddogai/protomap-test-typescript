import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingLevelCycleView, toRollingLevelCycleViews } from "./rolling-level-cycle-view.js";
import { newRollingLevelCycle } from "./rolling-level-cycle.js";

test("RollingLevelCycleView shows the status in capitals", () => {
  const item = newRollingLevelCycle("code-623", "title-646");
  const view = toRollingLevelCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingLevelCycleViews([item, item]).length, 2, "views");
});
