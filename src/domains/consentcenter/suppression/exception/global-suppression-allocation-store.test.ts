import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSuppressionAllocationStore } from "./global-suppression-allocation-store.js";
import { newGlobalSuppressionAllocation } from "./global-suppression-allocation.js";

test("MemoryGlobalSuppressionAllocationStore finds what it saved", () => {
  const store = newMemoryGlobalSuppressionAllocationStore();
  const item = newGlobalSuppressionAllocation("code-88", "title-781");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
