import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveRewardRuleBundleView,
  toAdaptiveRewardRuleBundleViews,
} from "./adaptive-reward-rule-bundle-view.js";
import { newAdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

test("AdaptiveRewardRuleBundleView shows the status in capitals", () => {
  const item = newAdaptiveRewardRuleBundle("code-497", "label-891");
  const view = toAdaptiveRewardRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRewardRuleBundleViews([item, item]).length, 2, "views");
});
