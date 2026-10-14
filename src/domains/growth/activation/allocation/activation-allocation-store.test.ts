import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationAllocationStore } from "./activation-allocation-store.js";
import { newActivationAllocation } from "./activation-allocation.js";

test("MemoryActivationAllocationStore finds what it saved", () => {
  const store = newMemoryActivationAllocationStore();
  const item = newActivationAllocation("code-683", "label-415");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
