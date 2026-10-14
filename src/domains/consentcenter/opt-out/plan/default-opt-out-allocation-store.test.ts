import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultOptOutAllocationStore } from "./default-opt-out-allocation-store.js";
import { newDefaultOptOutAllocation } from "./default-opt-out-allocation.js";

test("MemoryDefaultOptOutAllocationStore finds what it saved", () => {
  const store = newMemoryDefaultOptOutAllocationStore();
  const item = newDefaultOptOutAllocation("code-803", "label-663");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
