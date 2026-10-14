import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintMappingStore } from "./complaint-mapping-store.js";
import { newComplaintMapping } from "./complaint-mapping.js";

test("MemoryComplaintMappingStore finds what it saved", () => {
  const store = newMemoryComplaintMappingStore();
  const item = newComplaintMapping("code-566", "name-305");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
