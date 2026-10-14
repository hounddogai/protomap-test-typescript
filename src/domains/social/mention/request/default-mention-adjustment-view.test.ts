import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultMentionAdjustmentView,
  toDefaultMentionAdjustmentViews,
} from "./default-mention-adjustment-view.js";
import { newDefaultMentionAdjustment } from "./default-mention-adjustment.js";

test("DefaultMentionAdjustmentView shows the status in capitals", () => {
  const item = newDefaultMentionAdjustment("code-954", "title-246");
  const view = toDefaultMentionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultMentionAdjustmentViews([item, item]).length, 2, "views");
});
