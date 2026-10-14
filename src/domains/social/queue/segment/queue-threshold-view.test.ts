import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueThresholdView, toQueueThresholdViews } from "./queue-threshold-view.js";
import { newQueueThreshold } from "./queue-threshold.js";

test("QueueThresholdView shows the status in capitals", () => {
  const item = newQueueThreshold("code-427", "name-833");
  const view = toQueueThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueThresholdViews([item, item]).length, 2, "views");
});
