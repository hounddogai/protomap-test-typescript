import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupTierStore } from "./warmup-tier-store.js";
import { newWarmupTier } from "./warmup-tier.js";

test("MemoryWarmupTierStore finds what it saved", () => {
  const store = newMemoryWarmupTierStore();
  const item = newWarmupTier("code-986", "title-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
