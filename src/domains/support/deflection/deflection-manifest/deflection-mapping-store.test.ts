import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionMappingStore } from "./deflection-mapping-store.js";
import { newDeflectionMapping } from "./deflection-mapping.js";

test("MemoryDeflectionMappingStore finds what it saved", () => {
  const store = newMemoryDeflectionMappingStore();
  const item = newDeflectionMapping("code-434", "title-90");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
