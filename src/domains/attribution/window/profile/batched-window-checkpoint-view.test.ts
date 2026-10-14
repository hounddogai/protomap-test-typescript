import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWindowCheckpointView, toBatchedWindowCheckpointViews } from "./batched-window-checkpoint-view.js";
import { newBatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

test("BatchedWindowCheckpointView shows the status in capitals", () => {
  const item = newBatchedWindowCheckpoint("code-150", "title-581");
  const view = toBatchedWindowCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWindowCheckpointViews([item, item]).length, 2, "views");
});
