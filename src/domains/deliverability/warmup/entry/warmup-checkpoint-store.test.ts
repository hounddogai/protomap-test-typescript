import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupCheckpointStore } from "./warmup-checkpoint-store.js";
import { newWarmupCheckpoint } from "./warmup-checkpoint.js";

test("MemoryWarmupCheckpointStore finds what it saved", () => {
  const store = newMemoryWarmupCheckpointStore();
  const item = newWarmupCheckpoint("code-89", "label-770");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
