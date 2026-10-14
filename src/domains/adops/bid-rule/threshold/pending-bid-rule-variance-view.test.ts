import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingBidRuleVarianceView, toPendingBidRuleVarianceViews } from "./pending-bid-rule-variance-view.js";
import { newPendingBidRuleVariance } from "./pending-bid-rule-variance.js";

test("PendingBidRuleVarianceView shows the status in capitals", () => {
  const item = newPendingBidRuleVariance("code-121", "title-871");
  const view = toPendingBidRuleVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingBidRuleVarianceViews([item, item]).length, 2, "views");
});
