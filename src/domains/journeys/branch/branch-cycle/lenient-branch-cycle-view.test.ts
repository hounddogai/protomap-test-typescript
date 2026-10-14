import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientBranchCycleView, toLenientBranchCycleViews } from "./lenient-branch-cycle-view.js";
import { newLenientBranchCycle } from "./lenient-branch-cycle.js";

test("LenientBranchCycleView shows the status in capitals", () => {
  const item = newLenientBranchCycle("code-769", "name-551");
  const view = toLenientBranchCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientBranchCycleViews([item, item]).length, 2, "views");
});
