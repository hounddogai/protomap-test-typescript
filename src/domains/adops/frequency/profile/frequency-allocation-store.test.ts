import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyAllocationStore } from "./frequency-allocation-store.js";
import { newFrequencyAllocation } from "./frequency-allocation.js";

test("MemoryFrequencyAllocationStore finds what it saved", () => {
  const store = newMemoryFrequencyAllocationStore();
  const item = newFrequencyAllocation("code-705", "label-931");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
