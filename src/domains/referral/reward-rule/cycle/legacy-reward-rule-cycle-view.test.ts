import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyRewardRuleCycleView, toLegacyRewardRuleCycleViews } from "./legacy-reward-rule-cycle-view.js";
import { newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

test("LegacyRewardRuleCycleView shows the status in capitals", () => {
  const item = newLegacyRewardRuleCycle("code-551", "name-709");
  const view = toLegacyRewardRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyRewardRuleCycleViews([item, item]).length, 2, "views");
});
