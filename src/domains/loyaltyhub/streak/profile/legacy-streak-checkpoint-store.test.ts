import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyStreakCheckpointStore } from "./legacy-streak-checkpoint-store.js";
import { newLegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

test("MemoryLegacyStreakCheckpointStore finds what it saved", () => {
  const store = newMemoryLegacyStreakCheckpointStore();
  const item = newLegacyStreakCheckpoint("code-112", "title-405");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
