import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultLevelCycleView, toDefaultLevelCycleViews } from "./default-level-cycle-view.js";
import { newDefaultLevelCycle } from "./default-level-cycle.js";

test("DefaultLevelCycleView shows the status in capitals", () => {
  const item = newDefaultLevelCycle("code-564", "name-630");
  const view = toDefaultLevelCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultLevelCycleViews([item, item]).length, 2, "views");
});
