import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardVarianceStore } from "./reward-variance-store.js";
import { newRewardVariance } from "./reward-variance.js";

test("MemoryRewardVarianceStore finds what it saved", () => {
  const store = newMemoryRewardVarianceStore();
  const item = newRewardVariance("code-918", "label-566");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
