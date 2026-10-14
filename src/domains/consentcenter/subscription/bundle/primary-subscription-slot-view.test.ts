import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySubscriptionSlotView, toPrimarySubscriptionSlotViews } from "./primary-subscription-slot-view.js";
import { newPrimarySubscriptionSlot } from "./primary-subscription-slot.js";

test("PrimarySubscriptionSlotView shows the status in capitals", () => {
  const item = newPrimarySubscriptionSlot("code-922", "title-157");
  const view = toPrimarySubscriptionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySubscriptionSlotViews([item, item]).length, 2, "views");
});
