import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTierAllocationStore } from "./adaptive-tier-allocation-store.js";
import { newAdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

test("MemoryAdaptiveTierAllocationStore finds what it saved", () => {
  const store = newMemoryAdaptiveTierAllocationStore();
  const item = newAdaptiveTierAllocation("code-19", "name-266");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
