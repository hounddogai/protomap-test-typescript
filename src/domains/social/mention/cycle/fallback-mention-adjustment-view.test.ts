import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackMentionAdjustmentView,
  toFallbackMentionAdjustmentViews,
} from "./fallback-mention-adjustment-view.js";
import { newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

test("FallbackMentionAdjustmentView shows the status in capitals", () => {
  const item = newFallbackMentionAdjustment("code-173", "label-273");
  const view = toFallbackMentionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackMentionAdjustmentViews([item, item]).length, 2, "views");
});
