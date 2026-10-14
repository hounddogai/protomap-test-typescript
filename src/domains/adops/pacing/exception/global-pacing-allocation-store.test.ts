import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPacingAllocationStore } from "./global-pacing-allocation-store.js";
import { newGlobalPacingAllocation } from "./global-pacing-allocation.js";

test("MemoryGlobalPacingAllocationStore finds what it saved", () => {
  const store = newMemoryGlobalPacingAllocationStore();
  const item = newGlobalPacingAllocation("code-146", "name-364");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
