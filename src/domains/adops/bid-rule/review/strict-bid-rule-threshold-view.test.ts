import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBidRuleThresholdView, toStrictBidRuleThresholdViews } from "./strict-bid-rule-threshold-view.js";
import { newStrictBidRuleThreshold } from "./strict-bid-rule-threshold.js";

test("StrictBidRuleThresholdView shows the status in capitals", () => {
  const item = newStrictBidRuleThreshold("code-3", "name-892");
  const view = toStrictBidRuleThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBidRuleThresholdViews([item, item]).length, 2, "views");
});
