import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingStreakCheckpointStore } from "./pending-streak-checkpoint-store.js";
import { newPendingStreakCheckpoint } from "./pending-streak-checkpoint.js";

test("MemoryPendingStreakCheckpointStore finds what it saved", () => {
  const store = newMemoryPendingStreakCheckpointStore();
  const item = newPendingStreakCheckpoint("code-658", "label-231");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
