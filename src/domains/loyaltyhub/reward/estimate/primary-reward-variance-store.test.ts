import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryRewardVarianceStore } from "./primary-reward-variance-store.js";
import { newPrimaryRewardVariance } from "./primary-reward-variance.js";

test("MemoryPrimaryRewardVarianceStore finds what it saved", () => {
  const store = newMemoryPrimaryRewardVarianceStore();
  const item = newPrimaryRewardVariance("code-634", "label-238");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
