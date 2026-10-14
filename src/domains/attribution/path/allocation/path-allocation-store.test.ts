import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathAllocationStore } from "./path-allocation-store.js";
import { newPathAllocation } from "./path-allocation.js";

test("MemoryPathAllocationStore finds what it saved", () => {
  const store = newMemoryPathAllocationStore();
  const item = newPathAllocation("code-493", "label-368");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
