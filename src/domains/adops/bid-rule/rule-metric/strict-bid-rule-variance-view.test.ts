import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBidRuleVarianceView, toStrictBidRuleVarianceViews } from "./strict-bid-rule-variance-view.js";
import { newStrictBidRuleVariance } from "./strict-bid-rule-variance.js";

test("StrictBidRuleVarianceView shows the status in capitals", () => {
  const item = newStrictBidRuleVariance("code-310", "label-93");
  const view = toStrictBidRuleVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBidRuleVarianceViews([item, item]).length, 2, "views");
});
