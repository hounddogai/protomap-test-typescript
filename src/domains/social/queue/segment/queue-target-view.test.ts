import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueTargetView, toQueueTargetViews } from "./queue-target-view.js";
import { newQueueTarget } from "./queue-target.js";

test("QueueTargetView shows the status in capitals", () => {
  const item = newQueueTarget("code-176", "name-107");
  const view = toQueueTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueTargetViews([item, item]).length, 2, "views");
});
