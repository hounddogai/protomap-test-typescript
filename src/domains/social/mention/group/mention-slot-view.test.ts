import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionSlotView, toMentionSlotViews } from "./mention-slot-view.js";
import { newMentionSlot } from "./mention-slot.js";

test("MentionSlotView shows the status in capitals", () => {
  const item = newMentionSlot("code-335", "label-823");
  const view = toMentionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionSlotViews([item, item]).length, 2, "views");
});
