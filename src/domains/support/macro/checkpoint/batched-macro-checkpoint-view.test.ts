import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedMacroCheckpointView, toBatchedMacroCheckpointViews } from "./batched-macro-checkpoint-view.js";
import { newBatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

test("BatchedMacroCheckpointView shows the status in capitals", () => {
  const item = newBatchedMacroCheckpoint("code-686", "title-238");
  const view = toBatchedMacroCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedMacroCheckpointViews([item, item]).length, 2, "views");
});
