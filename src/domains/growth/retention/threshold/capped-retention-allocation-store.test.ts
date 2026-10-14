import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedRetentionAllocationStore } from "./capped-retention-allocation-store.js";
import { newCappedRetentionAllocation } from "./capped-retention-allocation.js";

test("MemoryCappedRetentionAllocationStore finds what it saved", () => {
  const store = newMemoryCappedRetentionAllocationStore();
  const item = newCappedRetentionAllocation("code-770", "label-86");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
