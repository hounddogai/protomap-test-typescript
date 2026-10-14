import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueThresholdStore } from "./queue-threshold-store.js";
import { newQueueThreshold } from "./queue-threshold.js";

test("MemoryQueueThresholdStore finds what it saved", () => {
  const store = newMemoryQueueThresholdStore();
  const item = newQueueThreshold("code-427", "name-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
