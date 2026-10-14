import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathCycleView, toPathCycleViews } from "./path-cycle-view.js";
import { newPathCycle } from "./path-cycle.js";

test("PathCycleView shows the status in capitals", () => {
  const item = newPathCycle("code-285", "name-331");
  const view = toPathCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathCycleViews([item, item]).length, 2, "views");
});
