import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFrequencyAllocationStore } from "./rolling-frequency-allocation-store.js";
import { newRollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

test("MemoryRollingFrequencyAllocationStore finds what it saved", () => {
  const store = newMemoryRollingFrequencyAllocationStore();
  const item = newRollingFrequencyAllocation("code-318", "name-936");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
