import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDoubleOptInAllocationStore } from "./scheduled-double-opt-in-allocation-store.js";
import { newScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

test("MemoryScheduledDoubleOptInAllocationStore finds what it saved", () => {
  const store = newMemoryScheduledDoubleOptInAllocationStore();
  const item = newScheduledDoubleOptInAllocation("code-80", "label-111");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
