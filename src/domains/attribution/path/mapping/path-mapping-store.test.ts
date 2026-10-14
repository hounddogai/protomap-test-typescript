import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathMappingStore } from "./path-mapping-store.js";
import { newPathMapping } from "./path-mapping.js";

test("MemoryPathMappingStore finds what it saved", () => {
  const store = newMemoryPathMappingStore();
  const item = newPathMapping("code-135", "title-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
