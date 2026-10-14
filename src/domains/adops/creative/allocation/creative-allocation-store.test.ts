import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeAllocationStore } from "./creative-allocation-store.js";
import { newCreativeAllocation } from "./creative-allocation.js";

test("MemoryCreativeAllocationStore finds what it saved", () => {
  const store = newMemoryCreativeAllocationStore();
  const item = newCreativeAllocation("code-999", "name-354");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
