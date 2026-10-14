import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackQueueThresholdStore } from "./fallback-queue-threshold-store.js";
import { newFallbackQueueThreshold } from "./fallback-queue-threshold.js";

test("MemoryFallbackQueueThresholdStore finds what it saved", () => {
  const store = newMemoryFallbackQueueThresholdStore();
  const item = newFallbackQueueThreshold("code-950", "label-36");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
