import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBidRuleSlotView, toStrictBidRuleSlotViews } from "./strict-bid-rule-slot-view.js";
import { newStrictBidRuleSlot } from "./strict-bid-rule-slot.js";

test("StrictBidRuleSlotView shows the status in capitals", () => {
  const item = newStrictBidRuleSlot("code-112", "title-882");
  const view = toStrictBidRuleSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBidRuleSlotViews([item, item]).length, 2, "views");
});
