import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedSubscriptionAllocationStore } from "./capped-subscription-allocation-store.js";
import { newCappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

test("MemoryCappedSubscriptionAllocationStore finds what it saved", () => {
  const store = newMemoryCappedSubscriptionAllocationStore();
  const item = newCappedSubscriptionAllocation("code-568", "name-182");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
