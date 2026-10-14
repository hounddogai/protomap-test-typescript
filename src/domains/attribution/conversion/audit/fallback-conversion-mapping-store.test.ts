import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackConversionMappingStore } from "./fallback-conversion-mapping-store.js";
import { newFallbackConversionMapping } from "./fallback-conversion-mapping.js";

test("MemoryFallbackConversionMappingStore finds what it saved", () => {
  const store = newMemoryFallbackConversionMappingStore();
  const item = newFallbackConversionMapping("code-577", "name-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
