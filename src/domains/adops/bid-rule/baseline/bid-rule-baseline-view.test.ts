import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleBaselineView, toBidRuleBaselineViews } from "./bid-rule-baseline-view.js";
import { newBidRuleBaseline } from "./bid-rule-baseline.js";

test("BidRuleBaselineView shows the status in capitals", () => {
  const item = newBidRuleBaseline("code-302", "name-896");
  const view = toBidRuleBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleBaselineViews([item, item]).length, 2, "views");
});
