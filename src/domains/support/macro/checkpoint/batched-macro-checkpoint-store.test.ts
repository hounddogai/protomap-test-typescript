import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedMacroCheckpointStore } from "./batched-macro-checkpoint-store.js";
import { newBatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

test("MemoryBatchedMacroCheckpointStore finds what it saved", () => {
  const store = newMemoryBatchedMacroCheckpointStore();
  const item = newBatchedMacroCheckpoint("code-686", "title-238");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
