import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedActivationAllocationStore } from "./weighted-activation-allocation-store.js";
import { newWeightedActivationAllocation } from "./weighted-activation-allocation.js";

test("MemoryWeightedActivationAllocationStore finds what it saved", () => {
  const store = newMemoryWeightedActivationAllocationStore();
  const item = newWeightedActivationAllocation("code-845", "name-164");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
