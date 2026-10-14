import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalComplaintMappingStore } from "./regional-complaint-mapping-store.js";
import { newRegionalComplaintMapping } from "./regional-complaint-mapping.js";

test("MemoryRegionalComplaintMappingStore finds what it saved", () => {
  const store = newMemoryRegionalComplaintMappingStore();
  const item = newRegionalComplaintMapping("code-118", "name-475");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
