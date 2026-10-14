import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedQueueMappingStore } from "./weighted-queue-mapping-store.js";
import { newWeightedQueueMapping } from "./weighted-queue-mapping.js";

test("MemoryWeightedQueueMappingStore finds what it saved", () => {
  const store = newMemoryWeightedQueueMappingStore();
  const item = newWeightedQueueMapping("code-475", "label-718");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
