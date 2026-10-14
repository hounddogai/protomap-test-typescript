import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackRewardRuleBundleView,
  toFallbackRewardRuleBundleViews,
} from "./fallback-reward-rule-bundle-view.js";
import { newFallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

test("FallbackRewardRuleBundleView shows the status in capitals", () => {
  const item = newFallbackRewardRuleBundle("code-274", "title-239");
  const view = toFallbackRewardRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackRewardRuleBundleViews([item, item]).length, 2, "views");
});
