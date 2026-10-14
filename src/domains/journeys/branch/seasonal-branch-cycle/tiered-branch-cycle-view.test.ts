import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBranchCycleView, toTieredBranchCycleViews } from "./tiered-branch-cycle-view.js";
import { newTieredBranchCycle } from "./tiered-branch-cycle.js";

test("TieredBranchCycleView shows the status in capitals", () => {
  const item = newTieredBranchCycle("code-667", "name-563");
  const view = toTieredBranchCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBranchCycleViews([item, item]).length, 2, "views");
});
