import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionAllocationStore } from "./retention-allocation-store.js";
import { newRetentionAllocation } from "./retention-allocation.js";

test("MemoryRetentionAllocationStore finds what it saved", () => {
  const store = newMemoryRetentionAllocationStore();
  const item = newRetentionAllocation("code-103", "label-888");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
