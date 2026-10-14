import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedModelCheckpointStore } from "./batched-model-checkpoint-store.js";
import { newBatchedModelCheckpoint } from "./batched-model-checkpoint.js";

test("MemoryBatchedModelCheckpointStore finds what it saved", () => {
  const store = newMemoryBatchedModelCheckpointStore();
  const item = newBatchedModelCheckpoint("code-193", "name-940");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
