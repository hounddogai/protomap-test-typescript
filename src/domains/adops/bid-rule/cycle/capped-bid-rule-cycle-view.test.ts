import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedBidRuleCycleView, toCappedBidRuleCycleViews } from "./capped-bid-rule-cycle-view.js";
import { newCappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

test("CappedBidRuleCycleView shows the status in capitals", () => {
  const item = newCappedBidRuleCycle("code-586", "name-650");
  const view = toCappedBidRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedBidRuleCycleViews([item, item]).length, 2, "views");
});
