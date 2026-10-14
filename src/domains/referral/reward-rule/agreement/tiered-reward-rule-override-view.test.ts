import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredRewardRuleOverrideView,
  toTieredRewardRuleOverrideViews,
} from "./tiered-reward-rule-override-view.js";
import { newTieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

test("TieredRewardRuleOverrideView shows the status in capitals", () => {
  const item = newTieredRewardRuleOverride("code-556", "label-922");
  const view = toTieredRewardRuleOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardRuleOverrideViews([item, item]).length, 2, "views");
});
