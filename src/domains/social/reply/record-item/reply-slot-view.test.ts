import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplySlotView, toReplySlotViews } from "./reply-slot-view.js";
import { newReplySlot } from "./reply-slot.js";

test("ReplySlotView shows the status in capitals", () => {
  const item = newReplySlot("code-519", "title-838");
  const view = toReplySlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplySlotViews([item, item]).length, 2, "views");
});
