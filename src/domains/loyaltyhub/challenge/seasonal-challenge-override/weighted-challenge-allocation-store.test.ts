import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedChallengeAllocationStore } from "./weighted-challenge-allocation-store.js";
import { newWeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

test("MemoryWeightedChallengeAllocationStore finds what it saved", () => {
  const store = newMemoryWeightedChallengeAllocationStore();
  const item = newWeightedChallengeAllocation("code-698", "title-49");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
