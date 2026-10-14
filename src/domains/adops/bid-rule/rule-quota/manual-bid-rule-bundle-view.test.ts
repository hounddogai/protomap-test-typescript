import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBidRuleBundleView, toManualBidRuleBundleViews } from "./manual-bid-rule-bundle-view.js";
import { newManualBidRuleBundle } from "./manual-bid-rule-bundle.js";

test("ManualBidRuleBundleView shows the status in capitals", () => {
  const item = newManualBidRuleBundle("code-799", "title-199");
  const view = toManualBidRuleBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBidRuleBundleViews([item, item]).length, 2, "views");
});
