import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCreativeAllocationStore } from "./strict-creative-allocation-store.js";
import { newStrictCreativeAllocation } from "./strict-creative-allocation.js";

test("MemoryStrictCreativeAllocationStore finds what it saved", () => {
  const store = newMemoryStrictCreativeAllocationStore();
  const item = newStrictCreativeAllocation("code-639", "title-767");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
