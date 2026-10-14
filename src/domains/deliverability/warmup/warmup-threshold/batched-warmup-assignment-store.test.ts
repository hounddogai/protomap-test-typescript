import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedWarmupAssignmentStore } from "./batched-warmup-assignment-store.js";
import { newBatchedWarmupAssignment } from "./batched-warmup-assignment.js";

test("MemoryBatchedWarmupAssignmentStore finds what it saved", () => {
  const store = newMemoryBatchedWarmupAssignmentStore();
  const item = newBatchedWarmupAssignment("code-14", "label-1");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
