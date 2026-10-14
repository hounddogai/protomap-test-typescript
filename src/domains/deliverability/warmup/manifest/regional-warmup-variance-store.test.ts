import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalWarmupVarianceStore } from "./regional-warmup-variance-store.js";
import { newRegionalWarmupVariance } from "./regional-warmup-variance.js";

test("MemoryRegionalWarmupVarianceStore finds what it saved", () => {
  const store = newMemoryRegionalWarmupVarianceStore();
  const item = newRegionalWarmupVariance("code-962", "title-880");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
