import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultChallengeVarianceStore } from "./default-challenge-variance-store.js";
import { newDefaultChallengeVariance } from "./default-challenge-variance.js";

test("MemoryDefaultChallengeVarianceStore finds what it saved", () => {
  const store = newMemoryDefaultChallengeVarianceStore();
  const item = newDefaultChallengeVariance("code-398", "name-788");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
