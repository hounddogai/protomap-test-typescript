import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupThresholdStore } from "./warmup-threshold-store.js";
import { newWarmupThreshold } from "./warmup-threshold.js";

test("MemoryWarmupThresholdStore finds what it saved", () => {
  const store = newMemoryWarmupThresholdStore();
  const item = newWarmupThreshold("code-395", "title-7");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
