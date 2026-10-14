import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRewardRuleCycleView, toTieredRewardRuleCycleViews } from "./tiered-reward-rule-cycle-view.js";
import { newTieredRewardRuleCycle } from "./tiered-reward-rule-cycle.js";

test("TieredRewardRuleCycleView shows the status in capitals", () => {
  const item = newTieredRewardRuleCycle("code-821", "name-652");
  const view = toTieredRewardRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardRuleCycleViews([item, item]).length, 2, "views");
});
