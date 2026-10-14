import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalQueueVarianceStore } from "./global-queue-variance-store.js";
import { newGlobalQueueVariance } from "./global-queue-variance.js";

test("MemoryGlobalQueueVarianceStore finds what it saved", () => {
  const store = newMemoryGlobalQueueVarianceStore();
  const item = newGlobalQueueVariance("code-599", "label-743");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
