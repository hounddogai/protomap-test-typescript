import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceCheckpointStore } from "./bounce-checkpoint-store.js";
import { newBounceCheckpoint } from "./bounce-checkpoint.js";

test("MemoryBounceCheckpointStore finds what it saved", () => {
  const store = newMemoryBounceCheckpointStore();
  const item = newBounceCheckpoint("code-753", "label-35");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
