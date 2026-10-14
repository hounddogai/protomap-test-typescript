import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWarmupAssignmentView, toBatchedWarmupAssignmentViews } from "./batched-warmup-assignment-view.js";
import { newBatchedWarmupAssignment } from "./batched-warmup-assignment.js";

test("BatchedWarmupAssignmentView shows the status in capitals", () => {
  const item = newBatchedWarmupAssignment("code-14", "label-1");
  const view = toBatchedWarmupAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWarmupAssignmentViews([item, item]).length, 2, "views");
});
