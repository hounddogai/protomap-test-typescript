import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchCycleView, toBranchCycleViews } from "./branch-cycle-view.js";
import { newBranchCycle } from "./branch-cycle.js";

test("BranchCycleView shows the status in capitals", () => {
  const item = newBranchCycle("code-624", "title-324");
  const view = toBranchCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchCycleViews([item, item]).length, 2, "views");
});
