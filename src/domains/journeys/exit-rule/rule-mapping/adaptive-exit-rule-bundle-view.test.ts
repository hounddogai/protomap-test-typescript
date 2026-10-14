import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveExitRuleBundleView, toAdaptiveExitRuleBundleViews } from "./adaptive-exit-rule-bundle-view.js";
import { newAdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

test("AdaptiveExitRuleBundleView shows the status in capitals", () => {
  const item = newAdaptiveExitRuleBundle("code-735", "name-698");
  const view = toAdaptiveExitRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveExitRuleBundleViews([item, item]).length, 2, "views");
});
