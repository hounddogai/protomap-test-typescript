import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalApprovalSlotView, toRegionalApprovalSlotViews } from "./regional-approval-slot-view.js";
import { newRegionalApprovalSlot } from "./regional-approval-slot.js";

test("RegionalApprovalSlotView shows the status in capitals", () => {
  const item = newRegionalApprovalSlot("code-791", "label-915");
  const view = toRegionalApprovalSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalApprovalSlotViews([item, item]).length, 2, "views");
});
