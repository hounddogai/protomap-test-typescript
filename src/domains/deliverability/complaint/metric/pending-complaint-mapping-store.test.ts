import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingComplaintMappingStore } from "./pending-complaint-mapping-store.js";
import { newPendingComplaintMapping } from "./pending-complaint-mapping.js";

test("MemoryPendingComplaintMappingStore finds what it saved", () => {
  const store = newMemoryPendingComplaintMappingStore();
  const item = newPendingComplaintMapping("code-629", "name-380");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
