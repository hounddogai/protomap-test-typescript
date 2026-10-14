import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPostAllocationStore } from "./pending-post-allocation-store.js";
import { newPendingPostAllocation } from "./pending-post-allocation.js";

test("MemoryPendingPostAllocationStore finds what it saved", () => {
  const store = newMemoryPendingPostAllocationStore();
  const item = newPendingPostAllocation("code-334", "name-350");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
