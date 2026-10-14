import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitCheckpointStore } from "./wait-checkpoint-store.js";
import { newWaitCheckpoint } from "./wait-checkpoint.js";

test("MemoryWaitCheckpointStore finds what it saved", () => {
  const store = newMemoryWaitCheckpointStore();
  const item = newWaitCheckpoint("code-348", "label-915");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
