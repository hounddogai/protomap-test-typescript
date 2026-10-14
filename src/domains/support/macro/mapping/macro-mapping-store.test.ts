import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroMappingStore } from "./macro-mapping-store.js";
import { newMacroMapping } from "./macro-mapping.js";

test("MemoryMacroMappingStore finds what it saved", () => {
  const store = newMemoryMacroMappingStore();
  const item = newMacroMapping("code-215", "name-76");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
