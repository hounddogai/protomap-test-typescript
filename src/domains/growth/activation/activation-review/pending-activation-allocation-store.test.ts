import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingActivationAllocationStore } from "./pending-activation-allocation-store.js";
import { newPendingActivationAllocation } from "./pending-activation-allocation.js";

test("MemoryPendingActivationAllocationStore finds what it saved", () => {
  const store = newMemoryPendingActivationAllocationStore();
  const item = newPendingActivationAllocation("code-630", "title-328");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
