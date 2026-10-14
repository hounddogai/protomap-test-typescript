import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutAllocationStore } from "./opt-out-allocation-store.js";
import { newOptOutAllocation } from "./opt-out-allocation.js";

test("MemoryOptOutAllocationStore finds what it saved", () => {
  const store = newMemoryOptOutAllocationStore();
  const item = newOptOutAllocation("code-971", "label-585");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
