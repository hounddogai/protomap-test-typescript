import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledOptOutAllocationStore } from "./scheduled-opt-out-allocation-store.js";
import { newScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

test("MemoryScheduledOptOutAllocationStore finds what it saved", () => {
  const store = newMemoryScheduledOptOutAllocationStore();
  const item = newScheduledOptOutAllocation("code-859", "title-873");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
