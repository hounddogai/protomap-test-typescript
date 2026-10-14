import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionAllocationStore } from "./subscription-allocation-store.js";
import { newSubscriptionAllocation } from "./subscription-allocation.js";

test("MemorySubscriptionAllocationStore finds what it saved", () => {
  const store = newMemorySubscriptionAllocationStore();
  const item = newSubscriptionAllocation("code-379", "title-875");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
