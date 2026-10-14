import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakCheckpointStore } from "./streak-checkpoint-store.js";
import { newStreakCheckpoint } from "./streak-checkpoint.js";

test("MemoryStreakCheckpointStore finds what it saved", () => {
  const store = newMemoryStreakCheckpointStore();
  const item = newStreakCheckpoint("code-282", "title-733");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
