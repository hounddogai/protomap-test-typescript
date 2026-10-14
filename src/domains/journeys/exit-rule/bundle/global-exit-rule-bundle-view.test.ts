import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalExitRuleBundleView, toGlobalExitRuleBundleViews } from "./global-exit-rule-bundle-view.js";
import { newGlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

test("GlobalExitRuleBundleView shows the status in capitals", () => {
  const item = newGlobalExitRuleBundle("code-186", "name-44");
  const view = toGlobalExitRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalExitRuleBundleViews([item, item]).length, 2, "views");
});
