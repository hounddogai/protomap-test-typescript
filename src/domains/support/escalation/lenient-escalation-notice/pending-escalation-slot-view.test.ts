import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingEscalationSlotView, toPendingEscalationSlotViews } from "./pending-escalation-slot-view.js";
import { newPendingEscalationSlot } from "./pending-escalation-slot.js";

test("PendingEscalationSlotView shows the status in capitals", () => {
  const item = newPendingEscalationSlot("code-971", "title-101");
  const view = toPendingEscalationSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingEscalationSlotViews([item, item]).length, 2, "views");
});
