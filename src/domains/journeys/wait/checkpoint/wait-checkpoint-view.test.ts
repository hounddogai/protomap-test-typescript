import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitCheckpointView, toWaitCheckpointViews } from "./wait-checkpoint-view.js";
import { newWaitCheckpoint } from "./wait-checkpoint.js";

test("WaitCheckpointView shows the status in capitals", () => {
  const item = newWaitCheckpoint("code-348", "label-915");
  const view = toWaitCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitCheckpointViews([item, item]).length, 2, "views");
});
