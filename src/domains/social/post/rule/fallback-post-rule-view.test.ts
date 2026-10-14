import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPostRuleView, toFallbackPostRuleViews } from "./fallback-post-rule-view.js";
import { newFallbackPostRule } from "./fallback-post-rule.js";

test("FallbackPostRuleView shows the status in capitals", () => {
  const item = newFallbackPostRule("code-318", "label-415");
  const view = toFallbackPostRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPostRuleViews([item, item]).length, 2, "views");
});
