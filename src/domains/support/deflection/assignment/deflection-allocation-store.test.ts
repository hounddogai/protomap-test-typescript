import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionAllocationStore } from "./deflection-allocation-store.js";
import { newDeflectionAllocation } from "./deflection-allocation.js";

test("MemoryDeflectionAllocationStore finds what it saved", () => {
  const store = newMemoryDeflectionAllocationStore();
  const item = newDeflectionAllocation("code-6", "title-809");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
