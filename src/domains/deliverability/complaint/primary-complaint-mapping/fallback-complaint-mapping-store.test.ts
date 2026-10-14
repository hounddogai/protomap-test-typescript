import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackComplaintMappingStore } from "./fallback-complaint-mapping-store.js";
import { newFallbackComplaintMapping } from "./fallback-complaint-mapping.js";

test("MemoryFallbackComplaintMappingStore finds what it saved", () => {
  const store = newMemoryFallbackComplaintMappingStore();
  const item = newFallbackComplaintMapping("code-537", "name-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
