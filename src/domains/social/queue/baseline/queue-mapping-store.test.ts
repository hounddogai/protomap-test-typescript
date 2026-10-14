import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueMappingStore } from "./queue-mapping-store.js";
import { newQueueMapping } from "./queue-mapping.js";

test("MemoryQueueMappingStore finds what it saved", () => {
  const store = newMemoryQueueMappingStore();
  const item = newQueueMapping("code-23", "label-524");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
