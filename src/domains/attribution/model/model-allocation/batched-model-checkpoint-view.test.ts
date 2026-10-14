import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedModelCheckpointView, toBatchedModelCheckpointViews } from "./batched-model-checkpoint-view.js";
import { newBatchedModelCheckpoint } from "./batched-model-checkpoint.js";

test("BatchedModelCheckpointView shows the status in capitals", () => {
  const item = newBatchedModelCheckpoint("code-193", "name-940");
  const view = toBatchedModelCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedModelCheckpointViews([item, item]).length, 2, "views");
});
