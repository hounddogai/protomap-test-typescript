import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientQueueThresholdStore } from "./lenient-queue-threshold-store.js";
import { newLenientQueueThreshold } from "./lenient-queue-threshold.js";

test("MemoryLenientQueueThresholdStore finds what it saved", () => {
  const store = newMemoryLenientQueueThresholdStore();
  const item = newLenientQueueThreshold("code-81", "title-704");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
