import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedQueueMilestoneStore } from "./batched-queue-milestone-store.js";
import { newBatchedQueueMilestone } from "./batched-queue-milestone.js";

test("MemoryBatchedQueueMilestoneStore finds what it saved", () => {
  const store = newMemoryBatchedQueueMilestoneStore();
  const item = newBatchedQueueMilestone("code-810", "label-102");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
