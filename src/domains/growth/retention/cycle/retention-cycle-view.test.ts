import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionCycleView, toRetentionCycleViews } from "./retention-cycle-view.js";
import { newRetentionCycle } from "./retention-cycle.js";

test("RetentionCycleView shows the status in capitals", () => {
  const item = newRetentionCycle("code-941", "name-965");
  const view = toRetentionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionCycleViews([item, item]).length, 2, "views");
});
