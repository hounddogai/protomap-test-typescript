import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledWaitCycleView, toScheduledWaitCycleViews } from "./scheduled-wait-cycle-view.js";
import { newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

test("ScheduledWaitCycleView shows the status in capitals", () => {
  const item = newScheduledWaitCycle("code-667", "title-389");
  const view = toScheduledWaitCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledWaitCycleViews([item, item]).length, 2, "views");
});
