import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredWarmupThresholdStore } from "./tiered-warmup-threshold-store.js";
import { newTieredWarmupThreshold } from "./tiered-warmup-threshold.js";

test("MemoryTieredWarmupThresholdStore finds what it saved", () => {
  const store = newMemoryTieredWarmupThresholdStore();
  const item = newTieredWarmupThreshold("code-173", "name-631");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
