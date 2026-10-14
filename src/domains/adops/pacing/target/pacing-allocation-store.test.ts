import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingAllocationStore } from "./pacing-allocation-store.js";
import { newPacingAllocation } from "./pacing-allocation.js";

test("MemoryPacingAllocationStore finds what it saved", () => {
  const store = newMemoryPacingAllocationStore();
  const item = newPacingAllocation("code-629", "name-621");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
