import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultChallengeThresholdStore } from "./default-challenge-threshold-store.js";
import { newDefaultChallengeThreshold } from "./default-challenge-threshold.js";

test("MemoryDefaultChallengeThresholdStore finds what it saved", () => {
  const store = newMemoryDefaultChallengeThresholdStore();
  const item = newDefaultChallengeThreshold("code-947", "title-249");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
