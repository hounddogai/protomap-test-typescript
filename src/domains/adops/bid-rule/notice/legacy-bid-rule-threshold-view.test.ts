import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBidRuleThresholdView, toLegacyBidRuleThresholdViews } from "./legacy-bid-rule-threshold-view.js";
import { newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

test("LegacyBidRuleThresholdView shows the status in capitals", () => {
  const item = newLegacyBidRuleThreshold("code-233", "label-384");
  const view = toLegacyBidRuleThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBidRuleThresholdViews([item, item]).length, 2, "views");
});
