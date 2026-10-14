import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionAdjustmentView, toMentionAdjustmentViews } from "./mention-adjustment-view.js";
import { newMentionAdjustment } from "./mention-adjustment.js";

test("MentionAdjustmentView shows the status in capitals", () => {
  const item = newMentionAdjustment("code-365", "label-233");
  const view = toMentionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionAdjustmentViews([item, item]).length, 2, "views");
});
