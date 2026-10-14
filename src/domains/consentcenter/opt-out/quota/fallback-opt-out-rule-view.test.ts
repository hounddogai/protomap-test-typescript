import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackOptOutRuleView, toFallbackOptOutRuleViews } from "./fallback-opt-out-rule-view.js";
import { newFallbackOptOutRule } from "./fallback-opt-out-rule.js";

test("FallbackOptOutRuleView shows the status in capitals", () => {
  const item = newFallbackOptOutRule("code-27", "label-897");
  const view = toFallbackOptOutRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackOptOutRuleViews([item, item]).length, 2, "views");
});
