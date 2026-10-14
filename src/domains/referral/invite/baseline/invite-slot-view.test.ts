import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteSlotView, toInviteSlotViews } from "./invite-slot-view.js";
import { newInviteSlot } from "./invite-slot.js";

test("InviteSlotView shows the status in capitals", () => {
  const item = newInviteSlot("code-674", "label-90");
  const view = toInviteSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteSlotViews([item, item]).length, 2, "views");
});
