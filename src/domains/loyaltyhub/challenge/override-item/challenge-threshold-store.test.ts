import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeThresholdStore } from "./challenge-threshold-store.js";
import { newChallengeThreshold } from "./challenge-threshold.js";

test("MemoryChallengeThresholdStore finds what it saved", () => {
  const store = newMemoryChallengeThresholdStore();
  const item = newChallengeThreshold("code-92", "name-175");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
