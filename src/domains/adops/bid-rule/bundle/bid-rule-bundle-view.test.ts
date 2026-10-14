import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleBundleView, toBidRuleBundleViews } from "./bid-rule-bundle-view.js";
import { newBidRuleBundle } from "./bid-rule-bundle.js";

test("BidRuleBundleView shows the status in capitals", () => {
  const item = newBidRuleBundle("code-759", "label-178");
  const view = toBidRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleBundleViews([item, item]).length, 2, "views");
});
