import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyAdjustmentView, toReplyAdjustmentViews } from "./reply-adjustment-view.js";
import { newReplyAdjustment } from "./reply-adjustment.js";

test("ReplyAdjustmentView shows the status in capitals", () => {
  const item = newReplyAdjustment("code-354", "name-242");
  const view = toReplyAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyAdjustmentViews([item, item]).length, 2, "views");
});
