import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientChallengeCheckpointStore } from "./lenient-challenge-checkpoint-store.js";
import { newLenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

test("MemoryLenientChallengeCheckpointStore finds what it saved", () => {
  const store = newMemoryLenientChallengeCheckpointStore();
  const item = newLenientChallengeCheckpoint("code-479", "label-335");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
