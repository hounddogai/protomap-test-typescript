import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleAdjustmentView, toBidRuleAdjustmentViews } from "./bid-rule-adjustment-view.js";
import { newBidRuleAdjustment } from "./bid-rule-adjustment.js";

test("BidRuleAdjustmentView shows the status in capitals", () => {
  const item = newBidRuleAdjustment("code-94", "name-273");
  const view = toBidRuleAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleAdjustmentViews([item, item]).length, 2, "views");
});
