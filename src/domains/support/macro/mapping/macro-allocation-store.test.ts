import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroAllocationStore } from "./macro-allocation-store.js";
import { newMacroAllocation } from "./macro-allocation.js";

test("MemoryMacroAllocationStore finds what it saved", () => {
  const store = newMemoryMacroAllocationStore();
  const item = newMacroAllocation("code-708", "name-532");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
