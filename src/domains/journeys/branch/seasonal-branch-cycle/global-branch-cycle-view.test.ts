import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBranchCycleView, toGlobalBranchCycleViews } from "./global-branch-cycle-view.js";
import { newGlobalBranchCycle } from "./global-branch-cycle.js";

test("GlobalBranchCycleView shows the status in capitals", () => {
  const item = newGlobalBranchCycle("code-128", "label-880");
  const view = toGlobalBranchCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBranchCycleViews([item, item]).length, 2, "views");
});
