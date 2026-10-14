import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceMappingStore } from "./bounce-mapping-store.js";
import { newBounceMapping } from "./bounce-mapping.js";

test("MemoryBounceMappingStore finds what it saved", () => {
  const store = newMemoryBounceMappingStore();
  const item = newBounceMapping("code-377", "name-122");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
