import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeAllocationStore } from "./badge-allocation-store.js";
import { newBadgeAllocation } from "./badge-allocation.js";

test("MemoryBadgeAllocationStore finds what it saved", () => {
  const store = newMemoryBadgeAllocationStore();
  const item = newBadgeAllocation("code-66", "name-280");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
