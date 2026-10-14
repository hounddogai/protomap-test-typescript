import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardCycleView, toRewardCycleViews } from "./reward-cycle-view.js";
import { newRewardCycle } from "./reward-cycle.js";

test("RewardCycleView shows the status in capitals", () => {
  const item = newRewardCycle("code-467", "title-723");
  const view = toRewardCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardCycleViews([item, item]).length, 2, "views");
});
