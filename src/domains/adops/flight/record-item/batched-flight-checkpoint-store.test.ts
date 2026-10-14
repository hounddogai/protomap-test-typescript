import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFlightCheckpointStore } from "./batched-flight-checkpoint-store.js";
import { newBatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

test("MemoryBatchedFlightCheckpointStore finds what it saved", () => {
  const store = newMemoryBatchedFlightCheckpointStore();
  const item = newBatchedFlightCheckpoint("code-98", "title-749");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
