import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackBidRuleOverrideView, toFallbackBidRuleOverrideViews } from "./fallback-bid-rule-override-view.js";
import { newFallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

test("FallbackBidRuleOverrideView shows the status in capitals", () => {
  const item = newFallbackBidRuleOverride("code-829", "label-927");
  const view = toFallbackBidRuleOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBidRuleOverrideViews([item, item]).length, 2, "views");
});
