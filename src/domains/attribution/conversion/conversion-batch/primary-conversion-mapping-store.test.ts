import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryConversionMappingStore } from "./primary-conversion-mapping-store.js";
import { newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

test("MemoryPrimaryConversionMappingStore finds what it saved", () => {
  const store = newMemoryPrimaryConversionMappingStore();
  const item = newPrimaryConversionMapping("code-616", "label-774");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
