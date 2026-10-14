import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackQueueVarianceStore } from "./fallback-queue-variance-store.js";
import { newFallbackQueueVariance } from "./fallback-queue-variance.js";

test("MemoryFallbackQueueVarianceStore finds what it saved", () => {
  const store = newMemoryFallbackQueueVarianceStore();
  const item = newFallbackQueueVariance("code-626", "label-726");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
