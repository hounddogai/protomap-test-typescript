import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleRollupView, toBidRuleRollupViews } from "./bid-rule-rollup-view.js";
import { newBidRuleRollup } from "./bid-rule-rollup.js";

test("BidRuleRollupView shows the status in capitals", () => {
  const item = newBidRuleRollup("code-126", "label-995");
  const view = toBidRuleRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleRollupViews([item, item]).length, 2, "views");
});
