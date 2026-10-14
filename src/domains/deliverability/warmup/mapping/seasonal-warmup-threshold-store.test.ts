import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWarmupThresholdStore } from "./seasonal-warmup-threshold-store.js";
import { newSeasonalWarmupThreshold } from "./seasonal-warmup-threshold.js";

test("MemorySeasonalWarmupThresholdStore finds what it saved", () => {
  const store = newMemorySeasonalWarmupThresholdStore();
  const item = newSeasonalWarmupThreshold("code-145", "label-474");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
