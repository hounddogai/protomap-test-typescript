import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupVarianceStore } from "./warmup-variance-store.js";
import { newWarmupVariance } from "./warmup-variance.js";

test("MemoryWarmupVarianceStore finds what it saved", () => {
  const store = newMemoryWarmupVarianceStore();
  const item = newWarmupVariance("code-568", "name-952");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
