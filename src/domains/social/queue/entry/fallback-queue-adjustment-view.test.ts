import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackQueueAdjustmentView, toFallbackQueueAdjustmentViews } from "./fallback-queue-adjustment-view.js";
import { newFallbackQueueAdjustment } from "./fallback-queue-adjustment.js";

test("FallbackQueueAdjustmentView shows the status in capitals", () => {
  const item = newFallbackQueueAdjustment("code-909", "title-71");
  const view = toFallbackQueueAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackQueueAdjustmentViews([item, item]).length, 2, "views");
});
