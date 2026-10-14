import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelMappingStore } from "./model-mapping-store.js";
import { newModelMapping } from "./model-mapping.js";

test("MemoryModelMappingStore finds what it saved", () => {
  const store = newMemoryModelMappingStore();
  const item = newModelMapping("code-280", "label-720");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
