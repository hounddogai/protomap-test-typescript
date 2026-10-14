import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditAllocationStore } from "./credit-allocation-store.js";
import { newCreditAllocation } from "./credit-allocation.js";

test("MemoryCreditAllocationStore finds what it saved", () => {
  const store = newMemoryCreditAllocationStore();
  const item = newCreditAllocation("code-943", "name-690");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
