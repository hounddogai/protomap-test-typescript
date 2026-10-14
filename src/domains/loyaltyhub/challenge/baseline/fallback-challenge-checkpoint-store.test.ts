import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackChallengeCheckpointStore } from "./fallback-challenge-checkpoint-store.js";
import { newFallbackChallengeCheckpoint } from "./fallback-challenge-checkpoint.js";

test("MemoryFallbackChallengeCheckpointStore finds what it saved", () => {
  const store = newMemoryFallbackChallengeCheckpointStore();
  const item = newFallbackChallengeCheckpoint("code-255", "name-487");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
