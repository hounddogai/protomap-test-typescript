import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalSlotView, toApprovalSlotViews } from "./approval-slot-view.js";
import { newApprovalSlot } from "./approval-slot.js";

test("ApprovalSlotView shows the status in capitals", () => {
  const item = newApprovalSlot("code-203", "name-518");
  const view = toApprovalSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalSlotViews([item, item]).length, 2, "views");
});
