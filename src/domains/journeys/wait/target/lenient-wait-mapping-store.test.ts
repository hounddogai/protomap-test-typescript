import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWaitMappingStore } from "./lenient-wait-mapping-store.js";
import { newLenientWaitMapping } from "./lenient-wait-mapping.js";

test("MemoryLenientWaitMappingStore finds what it saved", () => {
  const store = newMemoryLenientWaitMappingStore();
  const item = newLenientWaitMapping("code-124", "name-729");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
