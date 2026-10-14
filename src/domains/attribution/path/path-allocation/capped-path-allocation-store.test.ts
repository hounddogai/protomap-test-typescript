import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPathAllocationStore } from "./capped-path-allocation-store.js";
import { newCappedPathAllocation } from "./capped-path-allocation.js";

test("MemoryCappedPathAllocationStore finds what it saved", () => {
  const store = newMemoryCappedPathAllocationStore();
  const item = newCappedPathAllocation("code-789", "name-715");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
