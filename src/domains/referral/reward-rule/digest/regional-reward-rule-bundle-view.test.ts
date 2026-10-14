import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalRewardRuleBundleView,
  toRegionalRewardRuleBundleViews,
} from "./regional-reward-rule-bundle-view.js";
import { newRegionalRewardRuleBundle } from "./regional-reward-rule-bundle.js";

test("RegionalRewardRuleBundleView shows the status in capitals", () => {
  const item = newRegionalRewardRuleBundle("code-641", "label-162");
  const view = toRegionalRewardRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRewardRuleBundleViews([item, item]).length, 2, "views");
});
