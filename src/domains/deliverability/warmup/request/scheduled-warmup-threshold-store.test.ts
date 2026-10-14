import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWarmupThresholdStore } from "./scheduled-warmup-threshold-store.js";
import { newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

test("MemoryScheduledWarmupThresholdStore finds what it saved", () => {
  const store = newMemoryScheduledWarmupThresholdStore();
  const item = newScheduledWarmupThreshold("code-818", "title-901");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
