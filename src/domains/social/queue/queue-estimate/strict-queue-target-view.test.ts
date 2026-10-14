import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictQueueTargetView, toStrictQueueTargetViews } from "./strict-queue-target-view.js";
import { newStrictQueueTarget } from "./strict-queue-target.js";

test("StrictQueueTargetView shows the status in capitals", () => {
  const item = newStrictQueueTarget("code-122", "title-797");
  const view = toStrictQueueTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictQueueTargetViews([item, item]).length, 2, "views");
});
