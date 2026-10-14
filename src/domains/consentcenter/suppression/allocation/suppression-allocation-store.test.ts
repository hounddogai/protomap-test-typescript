import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionAllocationStore } from "./suppression-allocation-store.js";
import { newSuppressionAllocation } from "./suppression-allocation.js";

test("MemorySuppressionAllocationStore finds what it saved", () => {
  const store = newMemorySuppressionAllocationStore();
  const item = newSuppressionAllocation("code-883", "name-357");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
