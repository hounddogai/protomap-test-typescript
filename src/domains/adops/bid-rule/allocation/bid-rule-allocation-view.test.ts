import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleAllocationView, toBidRuleAllocationViews } from "./bid-rule-allocation-view.js";
import { newBidRuleAllocation } from "./bid-rule-allocation.js";

test("BidRuleAllocationView shows the status in capitals", () => {
  const item = newBidRuleAllocation("code-149", "title-60");
  const view = toBidRuleAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleAllocationViews([item, item]).length, 2, "views");
});
