import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBranchCycleView, toAdaptiveBranchCycleViews } from "./adaptive-branch-cycle-view.js";
import { newAdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

test("AdaptiveBranchCycleView shows the status in capitals", () => {
  const item = newAdaptiveBranchCycle("code-383", "label-958");
  const view = toAdaptiveBranchCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBranchCycleViews([item, item]).length, 2, "views");
});
