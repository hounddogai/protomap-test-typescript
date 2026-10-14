import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackActivationAllocationStore } from "./fallback-activation-allocation-store.js";
import { newFallbackActivationAllocation } from "./fallback-activation-allocation.js";

test("MemoryFallbackActivationAllocationStore finds what it saved", () => {
  const store = newMemoryFallbackActivationAllocationStore();
  const item = newFallbackActivationAllocation("code-429", "title-586");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
