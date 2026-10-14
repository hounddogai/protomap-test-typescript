import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardAllocationStore } from "./reward-allocation-store.js";
import { newRewardAllocation } from "./reward-allocation.js";

test("MemoryRewardAllocationStore finds what it saved", () => {
  const store = newMemoryRewardAllocationStore();
  const item = newRewardAllocation("code-824", "label-919");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
