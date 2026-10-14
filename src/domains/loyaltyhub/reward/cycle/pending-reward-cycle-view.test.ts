import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRewardCycleView, toPendingRewardCycleViews } from "./pending-reward-cycle-view.js";
import { newPendingRewardCycle } from "./pending-reward-cycle.js";

test("PendingRewardCycleView shows the status in capitals", () => {
  const item = newPendingRewardCycle("code-493", "label-116");
  const view = toPendingRewardCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRewardCycleViews([item, item]).length, 2, "views");
});
