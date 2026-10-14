import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryWarmupTierStore } from "./primary-warmup-tier-store.js";
import { newPrimaryWarmupTier } from "./primary-warmup-tier.js";

test("MemoryPrimaryWarmupTierStore finds what it saved", () => {
  const store = newMemoryPrimaryWarmupTierStore();
  const item = newPrimaryWarmupTier("code-759", "label-206");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
