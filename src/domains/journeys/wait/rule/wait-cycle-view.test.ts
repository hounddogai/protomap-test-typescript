import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitCycleView, toWaitCycleViews } from "./wait-cycle-view.js";
import { newWaitCycle } from "./wait-cycle.js";

test("WaitCycleView shows the status in capitals", () => {
  const item = newWaitCycle("code-394", "title-998");
  const view = toWaitCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitCycleViews([item, item]).length, 2, "views");
});
