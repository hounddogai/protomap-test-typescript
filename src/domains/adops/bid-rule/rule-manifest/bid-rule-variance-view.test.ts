import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleVarianceView, toBidRuleVarianceViews } from "./bid-rule-variance-view.js";
import { newBidRuleVariance } from "./bid-rule-variance.js";

test("BidRuleVarianceView shows the status in capitals", () => {
  const item = newBidRuleVariance("code-761", "title-230");
  const view = toBidRuleVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleVarianceViews([item, item]).length, 2, "views");
});
