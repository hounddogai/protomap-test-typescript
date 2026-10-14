import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentAllocationStore } from "./enrollment-allocation-store.js";
import { newEnrollmentAllocation } from "./enrollment-allocation.js";

test("MemoryEnrollmentAllocationStore finds what it saved", () => {
  const store = newMemoryEnrollmentAllocationStore();
  const item = newEnrollmentAllocation("code-958", "title-524");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
