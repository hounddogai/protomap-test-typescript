import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedBidRuleOverrideView, toCappedBidRuleOverrideViews } from "./capped-bid-rule-override-view.js";
import { newCappedBidRuleOverride } from "./capped-bid-rule-override.js";

test("CappedBidRuleOverrideView shows the status in capitals", () => {
  const item = newCappedBidRuleOverride("code-638", "name-506");
  const view = toCappedBidRuleOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedBidRuleOverrideViews([item, item]).length, 2, "views");
});
