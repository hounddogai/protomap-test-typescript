import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintAllocationStore } from "./complaint-allocation-store.js";
import { newComplaintAllocation } from "./complaint-allocation.js";

test("MemoryComplaintAllocationStore finds what it saved", () => {
  const store = newMemoryComplaintAllocationStore();
  const item = newComplaintAllocation("code-694", "name-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
