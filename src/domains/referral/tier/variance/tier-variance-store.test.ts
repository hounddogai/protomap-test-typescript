import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierVarianceStore } from "./tier-variance-store.js";
import { newTierVariance } from "./tier-variance.js";

test("MemoryTierVarianceStore finds what it saved", () => {
  const store = newMemoryTierVarianceStore();
  const item = newTierVariance("code-126", "name-60");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
