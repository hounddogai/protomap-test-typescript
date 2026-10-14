import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitMappingStore } from "./wait-mapping-store.js";
import { newWaitMapping } from "./wait-mapping.js";

test("MemoryWaitMappingStore finds what it saved", () => {
  const store = newMemoryWaitMappingStore();
  const item = newWaitMapping("code-243", "name-969");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
