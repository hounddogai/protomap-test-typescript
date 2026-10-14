import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeVarianceStore } from "./challenge-variance-store.js";
import { newChallengeVariance } from "./challenge-variance.js";

test("MemoryChallengeVarianceStore finds what it saved", () => {
  const store = newMemoryChallengeVarianceStore();
  const item = newChallengeVariance("code-259", "title-912");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
