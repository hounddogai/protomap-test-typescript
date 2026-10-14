import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTierVarianceStore } from "./capped-tier-variance-store.js";
import { newCappedTierVariance } from "./capped-tier-variance.js";

test("MemoryCappedTierVarianceStore finds what it saved", () => {
  const store = newMemoryCappedTierVarianceStore();
  const item = newCappedTierVariance("code-736", "title-167");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
