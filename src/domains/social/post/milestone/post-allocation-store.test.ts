import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostAllocationStore } from "./post-allocation-store.js";
import { newPostAllocation } from "./post-allocation.js";

test("MemoryPostAllocationStore finds what it saved", () => {
  const store = newMemoryPostAllocationStore();
  const item = newPostAllocation("code-597", "label-794");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
